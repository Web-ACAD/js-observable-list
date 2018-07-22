import {EventEmitter} from '@angular/core';
import {DataSource, CollectionViewer} from '@angular/cdk/collections';
import {Observable, BehaviorSubject} from 'rxjs';

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


	public readonly onInserted: EventEmitter<T> = new EventEmitter<T>();

	public readonly onUpdated: EventEmitter<T> = new EventEmitter<T>();

	public readonly onRemoved: EventEmitter<T> = new EventEmitter<T>();

	public readonly onReplaced: EventEmitter<OnReplacedArg<T>> = new EventEmitter<OnReplacedArg<T>>();

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


	public connect(collectionViewer: CollectionViewer): BehaviorSubject<Array<T>>
	{
		this.list = new ObservableList<T>(this.repository, this.shouldIncludeNewEntity);

		this.list.onInserted.subscribe((item) => this.onInserted.emit(item));
		this.list.onUpdated.subscribe((item) => this.onUpdated.emit(item));
		this.list.onRemoved.subscribe((item) => this.onRemoved.emit(item));
		this.list.onReplaced.subscribe((item) => this.onReplaced.emit(item));

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
