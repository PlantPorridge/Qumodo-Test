import { Component, OnInit } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { Observable } from "rxjs";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(private http: Http) { }

  ngOnInit(): void {
    this.setAvailableFilterTypes();
  }

  /**
   * Columns we wish to show for each returned repo.
   * Adding a new column instance here will add it to the grid.
   */
  columns: Column[] = [
    new Column('full_name', 'string', 'Name'),
    new Column('created_at', 'date', 'Created At'),
    new Column('updated_at', 'date', 'Updated At'),
    new Column('pushed_at', 'date', 'Pushed At'),
  ]

  /**
   * User repo sort terms allowed by the github api.
   * Note: Organisation repo sorting is not provided by the api.
   */
  userSortTerms: FilterType[] = [
    new FilterType('', ''),
    new FilterType('Full Name', 'full_name'),    
    new FilterType('Created', 'created'),
    new FilterType('Updated', 'updated'),
    new FilterType('Pushed', 'pushed')
  ]

  /**
   * User repo filter types allowed by the github api.
   */
  userFilterTypes: FilterType[] = [
    new FilterType('All', 'all'),
    new FilterType('Owner', 'owner'),
    new FilterType('Member', 'member')
  ]

  /**
   * Organisation repo filter types allowed by the github api.
   */
  orgFilterTypes: FilterType[] = [
    new FilterType('All', 'all'),
    new FilterType('Public', 'public'),
    new FilterType('Private', 'private'),
    new FilterType('Forks', 'forks'),
    new FilterType('Sources', 'sources'),
    new FilterType('Member', 'member')
  ]

  private baseUrl: string = 'https://api.github.com/';
  private submittedForm: FormModel;  

  repos: IGithubRepo[];
  availableFilterTypes: FilterType[];  
  numberOfPages: number = 0;
  activePage: number = 1;
  formModel: FormModel = { 
    name: '', 
    ownerType: RepoOwnerType.USER, 
    sortDirection: SortDirection.ASC,
    sortTerm: null,
    filterType: null 
  };

  onSubmit() {
    this.submittedForm = Object.assign({}, this.formModel);

    /* Ensure we don't send an unnecessary sort parameter when working with organisations */
    if(this.formModel.ownerType == 'organisation') this.submittedForm.sortTerm = null; 
    
    this.activePage = 1;
    this.getRepos(this.submittedForm);
  }

  ownerTypeChange(newOwnerType: RepoOwnerType) {
    this.formModel.ownerType = newOwnerType;
    this.setAvailableFilterTypes();
  }

  selectPage(newPage: number) {
    this.activePage = newPage;
    this.getRepos(this.submittedForm);
  }

  private getRepos(model: FormModel) {
    if (!model) return;

    let url = this.getUrl(model);

    console.log("Calling: " + url);
    this.http.get(url).subscribe(
      e => { this.renderRepos(e.json()); this.determineNumberOfPages(e.headers); },
      err => console.warn(`error: ${err}`),
      () => console.log("Complete")
    );
  }

  private renderRepos(repos: IGithubRepo[]) {
    this.repos = repos;
  }

  private setAvailableFilterTypes(){
    this.availableFilterTypes = this.formModel.ownerType == RepoOwnerType.USER ? this.userFilterTypes : this.orgFilterTypes;
    this.formModel.filterType = this.availableFilterTypes[0];
  }

  private determineNumberOfPages(headers: Headers){
    let linkHeaders = headers.get('link');
    
    if (linkHeaders) {
      let lastPageLink = linkHeaders.split(',').find(l => l.indexOf('rel="last"') > -1);

      if (lastPageLink) {
        let numPagesStart = lastPageLink.indexOf("page=") + "page=".length;
        let numPagesEnd = lastPageLink.substring(numPagesStart).indexOf('&') + numPagesStart;
        this.numberOfPages = parseInt(lastPageLink.substring(numPagesStart, numPagesEnd));
      }

    } else {
      this.numberOfPages = 1;
    }
  }

  private getUrl(model: FormModel): string{
    let url = this.baseUrl;
    url += model.ownerType == RepoOwnerType.USER ? 'users/' : 'orgs/';
    url += model.name + '/repos';
    url += '?page=' + this.activePage + '&per_page=10';
    
    if(model.sortTerm && model.sortTerm.apiCode) url += '&sort=' + model.sortTerm.apiCode + "&direction=" + model.sortDirection;    
    
    if(model.filterType) url += '&type=' + model.filterType.apiCode;

    return url;
  }
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

export enum RepoOwnerType {
  USER = "user",
  ORGANISATION = "organisation"
}

export interface IGithubRepo {
  full_name: string;
  created_at: Date;
  updated_at: Date;
  pushed_at: Date;
}

export class FormModel {
  name: string;
  ownerType: RepoOwnerType;
  filterType: FilterType;
  sortTerm: FilterType;
  sortDirection: SortDirection;
}

export class FilterType {
  constructor(
    public name: string,
    public apiCode: string
  ) { }
}

export class Column {
  constructor(
    public id: string,
    public type: string,
    public header: string
  ) { }
}


