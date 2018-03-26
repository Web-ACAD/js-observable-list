import {EventEmitter} from '@angular/core';

import {ObservableRepository} from '../../src';
import {ObservableEntityMock} from './observable-entity-mock';


export class ObservableRepositoryMock implements ObservableRepository<ObservableEntityMock>
{


	public onInserted: EventEmitter<ObservableEntityMock> = new EventEmitter<ObservableEntityMock>();

	public onUpdated: EventEmitter<ObservableEntityMock> = new EventEmitter<ObservableEntityMock>();

	public onRemoved: EventEmitter<ObservableEntityMock> = new EventEmitter<ObservableEntityMock>();


	public insert(entity: ObservableEntityMock): void
	{
		this.onInserted.emit(entity);
	}


	public update(entity: ObservableEntityMock): void
	{
		this.onUpdated.emit(new ObservableEntityMock(entity.id));
	}


	public remove(entity: ObservableEntityMock): void
	{
		this.onRemoved.emit(entity);
	}

}
