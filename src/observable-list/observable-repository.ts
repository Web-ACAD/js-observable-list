import {EventEmitter} from '@angular/core';

import {ObservableEntity} from './observable-entity';


export declare interface ObservableReplacedEntity<T extends ObservableEntity>
{
	previous: T,
	next: T,
}


export interface ObservableRepository<T extends ObservableEntity>
{


	onInserted: EventEmitter<T>;

	onUpdated: EventEmitter<T>;

	onRemoved: EventEmitter<T>;

	onReplaced: EventEmitter<ObservableReplacedEntity<T>>;

}
