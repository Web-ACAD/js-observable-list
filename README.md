[![NPM version](https://img.shields.io/npm/v/@webacad/observable-list.svg?style=flat-square)](https://www.npmjs.com/package/@webacad/observable-list)
[![Build Status](https://img.shields.io/travis/Web-ACAD/js-observable-list.svg?style=flat-square)](https://travis-ci.org/Web-ACAD/js-observable-list)

# WebACAD/ObservableList

Automatic observable list for angular cdk or material table

## Installation

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
    
    constructor(
        public readonly id: string,
    ) {}
    
}
```

**Update `users-repository.service.ts`:**

Each observable repository needs to manage three event emitters:

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

**Create data source for cdk table `users-data-source.service.ts`:**

Now you only need to create the data source for your table with users.

```typescript
import {DataSource} from '@angular/cdk/collections';
import {ObservableList} from '@webacad/observable-list';
import {Observable} from 'rxjs/Observable';
import {UsersRepository} from '../users-repository.service';
import {User} from '../user';

export class UsersDataSource implements DataSource<User>
{

    private source: ObservableList<User>;
    
    constructor(
        private users: UsersRepository, 
    ) {}

    public connect(): Observable<Array<User>>
    {
        this.source = new ObservableList(this.users);
        return this.source.initList(this.users.getAll());
    }

    public disconnect(): void
    {
        if (this.source) {
            this.source.disconnect();
        }
    }
    
}
```

The `source` in your new `UsersDataSource` will be automatically updated whenever you insert, update or remove any user.

Just use that `UsersDataSource` either in `cdk-table` or in `mat-table` components:

```html
<cdk-table [dataSource]="usersDataSource">...</cdk-table>
```

or

```html
<mat-table [dataSource]="usersDataSource">...</mat-table>
```

## Immediate refresh without waiting for the backend

Imagine that you have a "add form" for your user and you want to show the new user row immediately after clicking on the 
save button. 

You could use the `onInserted` event alone, but after the "real" data is loaded from your API, you'll have no way of 
replacing the previous previous.

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

## Filter inserted users

By default all new users will appear in your browse list. That can be changed in the `UsersDataSource`:

```typescript
import {DataSource} from '@angular/cdk/collections';
import {ObservableList} from '@webacad/observable-list';
import {Observable} from 'rxjs/Observable';
import {UsersRepository} from '../users-repository.service';
import {User} from '../user';

export class UsersDataSource implements DataSource<User>
{

    // ...

    public connect(): Observable<Array<User>>
    {
        this.source = new ObservableList(this.users);
        return this.source.initList(this.users.getAll(), (newEntity: User) => {
            return newEntity.id === 5;
        });
    }
    
    // ...
    
}
```

Table with the `UsersDataSource` from above example will show new users only if they id is equal to `5`.
