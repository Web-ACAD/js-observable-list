import {EventEmitter} from '@angular/core';

import {ObservableEntity} from './observable-entity';


export interface ObservableRepository<T extends ObservableEntity>
{


	onInserted: EventEmitter<T>;

	onUpdated: EventEmitter<T>;

	onRemoved: EventEmitter<T>;

}
