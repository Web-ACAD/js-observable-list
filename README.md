[![NPM version](https://img.shields.io/npm/v/@webacad/observable-list.svg?style=flat-square)](https://www.npmjs.com/package/@webacad/observable-list)
[![Build Status](https://img.shields.io/travis/Web-ACAD/js-observable-list.svg?style=flat-square)](https://travis-ci.org/Web-ACAD/js-observable-list)

# WebACAD/ObservableList

Automatic observable list for angular cdk or material table

## Installation

**Version >= 2.0.0 depends on angular >= 6. For older versions of angular use @webacad/observable-list@^1.0.**

```bash
$ npm install --save @webacad/observable-list
```

or with yarn

```bash
$ yarn add @webacad/observable-list
```

## Usage

First you need to prepare your project to be able to work with this library.

This documentation will show you all the examples on `User` entity and `UsersRepository` classes.

**Update `user.ts`:**

Each observable entity needs to have an `id` property.

```typescript
import {ObservableEntity} from '@webacad/observable-list';

export class User implements ObservableEntity
{
    
    public id: number;
    
}
```

**Update `users-repository.service.ts`:**

Each observable repository needs to manage four event emitters:

* `onInserted`: emit newly inserted entity
* `onUpdated`: emit updated entity (emit new entity for immutable entities)
* `onRemoved`: emit removed entity
* `onReplaced`: emit replacement of entity (must provide previous and next versions)

```typescript
import {Injectable, EventEmitter} from '@angular/core';
import {ObservableRepository, ObservableReplacedEntity} from '@webacad/observable-list';
import {Observable} from 'rxjs/Observable';
import {from as ObservableFrom} from 'rxjs/observable/from';
import {User} from './user';

@Injectable()
export class UsersRepository implements ObservableRepository<User>
{
    
    public onInserted = new EventEmitter<User>();
    
    public onUpdated = new EventEmitter<User>();
    
    public onRemoved = new EventEmitter<User>();
    
    public onReplaced = new EventEmitter<ObservableReplacedEntity<User>>();
    
    public getAll(): Observable<Array<User>>
    {
        // todo: load real users
        return ObservableFrom([
            new User(1),
            new User(2),
        ]);
    }
    
    public insert(user: User): void
    {
        // todo: store new user 
        this.onInserted.emit(user);
    }
    
    public update(user: User): void
    {
        // todo: save updated user
        this.onUpdated.emit(user);
    }
    
    public remove(user: User): void
    {
        // todo: remove user
        this.onRemoved.emit(user);
    }
    
}
```

Now you only need to create the data source for your table with users.

```typescript
import {Component, OnInit} from '@angular/core';
import {ObservableDataSource, createObservableDataSource} from '@webacad/observable-list';
import {UsersRepository} from '../users-repository.service';
import {User} from '../user';

@Component({
    selector: 'add-users-table',
    templateUrl: './users-table.component.html',
})
export class UsersTable
{

    public dataSource: ObservableDataSource<User>;
    
    constructor(
        private users: UsersRepository,
    ) {
        this.createDataSource();
    }
    
    private createDataSource(): void
    {
        this.dataSource = createObservableDataSource(this.users, this.users.getAll());
    }
    
}
```

The `createObservableDataSource` function returns `DataSource` from `@angular/cdk` with all necessary configuration.

The first argument must be an `ObservableRepository` and the second `Observable<Array<any>>` with your data.

Now just use your new data source with either `cdk-table` or `mat-table`:

```html
<cdk-table [dataSource]="dataSource">...</cdk-table>
```

or

```html
<mat-table [dataSource]="dataSource">...</mat-table>
```

## Filter newly inserted entities

By default all newly created entities will appear in the data source. That behavior can be changed by providing the 
`options` for `createObservableDataSource`.

```typescript
createObservableDataSource(this.users, this.users.getAll(), {
    shouldIncludeNewEntity: (user: User) => {
        return user.id === 5;
    },
});
```

Now only users with ID `5` will be appended.

## Track by - performance improvements

Read more about `trackBy` in [angular documentation](https://angular.io/api/common/NgForOf#change-propagation).

This library provides you with default `trackBy` function which is using the ID's of your entities. If you wish to 
change it to something else, use the `options` for `createObservableDataSource` again.

```typescript
createObservableDataSource(this.users, this.users.getAll(), {
    trackBy: (i: number, user: User) => {
        return user.uuid;
    },
});
```

You must set the `[trackBy]` in your template, otherwise angular will use it's own default implementation:

```html
<cdk-table [dataSource]="dataSource" [trackBy]="dataSource.trackBy">...</cdk-table>
```

or

```html
<mat-table [dataSource]="dataSource" [trackBy]="dataSource.trackBy">...</mat-table>
```

## Immediate refresh without waiting for the backend

Imagine that you have a "add form" for your user and you want to show the new user row immediately after clicking on the 
save button. 

You could use the `onInserted` event alone, but after the "real" data is loaded from your API, you'll have no way of 
replacing the previous entity.

Instead you can use the combination of `onInserted` and `onReplaced`. 

```typescript
import {HttpClient} from '@angular/common/http';
import {map, tap} from 'rxjs/operators';

@Injectable()
export class UsersRepository implements ObservableRepository<User>
{
    
    // ...
    
    constructor(
        private http: HttpClient,
    ) {}
    
    public insert(user: User): Observable<User>
    {
        this.onInserted.emit(user);
        
        return this.http.post('/users', {
            email: user.email,
            password: user.password,
        }).pipe(
            map((data) => this.mapDataToEntity(data)),
            tap((newUser) => this.onReplaced.emit({
                previous: user,
                next: newUser,
            })),
        );
    }
    
    // ...
    
}
```

Just keep in mind, that the first version of user will probably not have any ID available.

## Reload all data

If you wish to refresh all data inside of your table, you can simply reuse the existing data source with the new data.

```typescript
dataSource.reload(users.getAll());
```

The `reload` method accepts a new `Observable<Array<any>>` type.

## Modify current data

```typescript
dataSource.modify((items: Observable<User>) => {
    return items.pipe(
        map((user) => user.update()),
    );
});
```

## Listen to changes

There are multiple events available on the data source class which could be used for listening to changes in data.

* `onInserted<EventEmitter<T>>`: emitted when new item is added to data
* `onUpdated<EventEmitter<T>>`: emitted when some item was updated by ID
* `onRemoved<EventEmitter<T>>`: emitted when an item was removed from data
* `onReplaced<EventEmitter<OnReplacedArg<T>>>`: emitted when an item was replaced 
