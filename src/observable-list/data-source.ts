import {EventEmitter} from '@angular/core';
import {DataSource, CollectionViewer} from '@angular/cdk/collections';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import {ObservableEntity} from './observable-entity';
import {ObservableList, ShouldIncludeNewEntity, OnReplacedArg} from './observable-list';
import {ObservableRepository} from './observable-repository';


export declare type ObservableDataSourceTrackBy<T extends ObservableEntity> = (i: number, entity: T) => any;


export declare interface ObservableDataSourceOptions<T extends ObservableEntity>
{
	shouldIncludeNewEntity?: ShouldIncludeNewEntity<T>,
	trackBy?: ObservableDataSourceTrackBy<T>,
}


export function createObservableDataSource<T extends ObservableEntity>(
	repository: ObservableRepository<T>,
	data: Observable<Array<T>>,
	options: ObservableDataSourceOptions<T> = {},
): ObservableDataSource<T> {
	return new ObservableDataSource(repository, data, options);
}


function defaultTrackByObservableEntity<T extends ObservableEntity>(i: number, entity: T): any
{
	if (typeof entity.id === 'undefined') {
		return i;
	}

	return entity.id;
}


export class ObservableDataSource<T extends ObservableEntity> implements DataSource<T>
{


	public readonly trackBy: ObservableDataSourceTrackBy<T>;

	private list: ObservableList<T>;

	private shouldIncludeNewEntity: ShouldIncludeNewEntity<T>;


	constructor(
		private repository: ObservableRepository<T>,
		private data: Observable<Array<T>>,
		options: ObservableDataSourceOptions<T>,
	) {
		this.shouldIncludeNewEntity = options.shouldIncludeNewEntity;
		this.trackBy = options.trackBy || defaultTrackByObservableEntity;
	}


	get onInserted(): EventEmitter<T>
	{
		this.checkList();
		return this.list.onInserted;
	}


	get onUpdated(): EventEmitter<T>
	{
		this.checkList();
		return this.list.onUpdated;
	}


	get onRemoved(): EventEmitter<T>
	{
		this.checkList();
		return this.list.onRemoved;
	}


	get onReplaced(): EventEmitter<OnReplacedArg<T>>
	{
		this.checkList();
		return this.list.onReplaced;
	}


	public connect(collectionViewer: CollectionViewer): BehaviorSubject<Array<T>>
	{
		this.list = new ObservableList<T>(this.repository, this.shouldIncludeNewEntity);
		return this.list.initList(this.data);
	}


	public disconnect(collectionViewer: CollectionViewer): void
	{
		if (this.list) {
			this.list.disconnect();
			this.list = undefined;
		}
	}


	public reload(data: Observable<Array<T>>): void
	{
		if (this.list) {
			this.list.reload(data);
		}
	}


	public modify(items: (data: Observable<T>) => Observable<T>): void
	{
		if (this.list) {
			this.list.modify(items);
		}
	}


	private checkList(): void
	{
		if (!this.list) {
			throw new Error('List is not ready');
		}
	}

}
