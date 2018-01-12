import { Component, OnInit } from '@angular/core';
import { Http, Response } from '@angular/http';
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

  columns: Column[] = [
    new Column('full_name', 'string', 'Name', 'full_name'),
    new Column('created_at', 'date', 'Created At', 'created'),
    new Column('updated_at', 'date', 'Updated At', 'updated'),
    new Column('pushed_at', 'date', 'Pushed At', 'pushed')
  ]

  userSortTerms: FilterType[] = [
    new FilterType('', ''),
    new FilterType('Full Name', 'full_name'),    
    new FilterType('Created', 'created'),
    new FilterType('Updated', 'updated'),
    new FilterType('Pushed', 'pushed')
  ]

  userFilterTypes: FilterType[] = [
    new FilterType('All', 'all'),
    new FilterType('Owner', 'owner'),
    new FilterType('Member', 'member')
  ]

  orgFilterTypes: FilterType[] = [
    new FilterType('All', 'all'),
    new FilterType('Public', 'public'),
    new FilterType('Private', 'private'),
    new FilterType('Forks', 'forks'),
    new FilterType('Sources', 'sources'),
    new FilterType('Member', 'member')
  ]

  baseUrl = 'https://api.github.com/';
  sortText: string = '';
  results: IGithubRepo[];
  numberOfPages: number = 0;
  activePage: number = 1;
  user: string = 'andygjenkins';
  formModel: FormModel = { 
    name: '', 
    ownerType: RepoOwnerType.USER, 
    sortDirection: SortDirection.ASC,
    sortTerm: null,
    filterType: null 
  };
  submittedForm: FormModel;
  availableFilterTypes: FilterType[];

  onSubmit() {
    console.log(this.formModel);
    this.submittedForm = Object.assign({}, this.formModel);
    this.activePage = 1;
    this.getRepos();
  }

  getRepos() {
    if (!this.submittedForm) return;

    let url = this.getUrl();

    console.log("Calling: " + url);
    this.http.get(url).subscribe(
      e => this.renderRepos(e),
      err => console.warn(`error: ${err}`),
      () => console.log("Complete")
    );
  }

  private getUrl(): string{
    let url = this.baseUrl;
    url += this.submittedForm.ownerType == RepoOwnerType.USER ? 'users/' : 'orgs/';
    url += this.submittedForm.name + '/repos';
    url += '?page=' + this.activePage + '&per_page=10';
    
    if(this.submittedForm.sortTerm && this.submittedForm.sortTerm.apiCode) url += '&sort=' + this.submittedForm.sortTerm.apiCode + "&direction=" + this.submittedForm.sortDirection;    
    if(this.submittedForm.filterType) url += '&type=' + this.submittedForm.filterType.apiCode;

    return url;
  }


  renderRepos(response: Response) {
    this.results = response.json();
    console.log(this.results);

    let linkHeaders = response.headers.get('link');

    if (linkHeaders) {
      let lastPageLink = response.headers.get('link').split(',').find(l => l.indexOf('rel="last"') > -1);

      if (lastPageLink) {
        this.numberOfPages = parseInt(lastPageLink[lastPageLink.indexOf("page=") + "page=".length]);
      }
    } else {
      this.numberOfPages = 1;
    }

  }

  ownerTypeChange($event: RepoOwnerType) {
    this.formModel.ownerType = $event;
    this.setAvailableFilterTypes();
  }

  setAvailableFilterTypes(){
    this.availableFilterTypes = this.formModel.ownerType == RepoOwnerType.USER ? this.userFilterTypes : this.orgFilterTypes;
    this.formModel.filterType = this.availableFilterTypes[0];
  }

  selectPage(newPage: number) {
    this.activePage = newPage;
    this.getRepos();
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
    public header: string,
    public sortTerm?: string
  ) { }
}


