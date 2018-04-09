import {DataSource, CollectionViewer} from '@angular/cdk/collections';
import {Observable} from 'rxjs/Observable';

import {ObservableEntity} from './observable-entity';
import {ObservableList, ShouldIncludeNewEntity} from './observable-list';
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
): any {
	return new ObservableDataSource(repository, data, options);
}


function defaultTrackByObservableEntity<T extends ObservableEntity>(i: number, entity: T): any
{
	return entity.id;
}


export class ObservableDataSource<T extends ObservableEntity> implements DataSource<T>
{


	private list: ObservableList<T>;

	private shouldIncludeNewEntity: ShouldIncludeNewEntity<T>;

	public readonly trackBy: ObservableDataSourceTrackBy<T>;


	constructor(
		private repository: ObservableRepository<T>,
		private data: Observable<Array<T>>,
		options: ObservableDataSourceOptions<T>,
	) {
		this.shouldIncludeNewEntity = options.shouldIncludeNewEntity;
		this.trackBy = options.trackBy || defaultTrackByObservableEntity;
	}


	public connect(collectionViewer: CollectionViewer): Observable<Array<T>>
	{
		this.list = new ObservableList<T>(this.repository);
		return this.list.initList(this.data, this.shouldIncludeNewEntity);
	}


	public disconnect(collectionViewer: CollectionViewer): void
	{
		if (this.list) {
			this.list.disconnect();
			this.list = undefined;
		}
	}

}
