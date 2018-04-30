import {EventEmitter} from '@angular/core';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {from as ObservableFrom} from 'rxjs/observable/from';
import {Subscription} from 'rxjs/Subscription';

import {ObservableEntity} from './observable-entity';
import {ObservableRepository} from './observable-repository';


export declare interface OnReplacedArg<T extends ObservableEntity>
{
	previous: T,
	next: T,
}

export declare type ShouldIncludeNewEntity<T extends ObservableEntity> = (newEntity: T) => boolean;

function defaultShouldIncludeNewEntity(): boolean
{
	return true;
}


export class ObservableList<T extends ObservableEntity>
{


	public onInserted: EventEmitter<T> = new EventEmitter<T>();

	public onUpdated: EventEmitter<T> = new EventEmitter<T>();

	public onRemoved: EventEmitter<T> = new EventEmitter<T>();

	public onReplaced: EventEmitter<OnReplacedArg<T>> = new EventEmitter<OnReplacedArg<T>>();

	private onInsertedSubscription: Subscription;

	private onUpdatedSubscription: Subscription;

	private onRemovedSubscription: Subscription;

	private onReplacedSubscriction: Subscription;

	private data: Array<T> = [];

	private subject: BehaviorSubject<Array<T>>;


	constructor(
		private $repository: ObservableRepository<T>,
		private shouldIncludeNewEntity: ShouldIncludeNewEntity<T> = defaultShouldIncludeNewEntity,
	) {}


	public initList(data: Observable<Array<T>>): BehaviorSubject<Array<T>>
	{
		if (this.subject) {
			this.disconnect();
		}

		return this.createList(data);
	}


	public disconnect(): void
	{
		if (this.subject) {
			this.onInsertedSubscription.unsubscribe();
			this.onUpdatedSubscription.unsubscribe();
			this.onRemovedSubscription.unsubscribe();
			this.onReplacedSubscriction.unsubscribe();

			this.data = [];
			this.subject = undefined;
		}
	}


	public reload(data: Observable<Array<T>>): void
	{
		data.subscribe((currentData) => {
			this.data = currentData;

			if (this.subject) {
				this.subject.next(this.data);
			}
		});
	}


	public modify(items: (data: Observable<T>) => Observable<T>): void
	{
		let observable = ObservableFrom(this.data);
		const newData: Array<T> = [];

		observable = items(observable);
		observable.subscribe((item) => {
			newData.push(item);
		});

		this.data = newData;

		if (this.subject) {
			this.subject.next(this.data);
		}
	}


	private createList(data: Observable<Array<T>>): BehaviorSubject<Array<T>>
	{
		this.subject = new BehaviorSubject<Array<T>>(this.data);

		data.subscribe((currentData) => {
			this.data = currentData;
			this.subject.next(this.data);
		});

		this.onInsertedSubscription = this.$repository.onInserted.subscribe((item) => {
			if (this.shouldIncludeNewEntity(item)) {
				this.data.push(item);
				this.subject.next(this.data);
				this.onInserted.emit(item);
			}
		});

		this.onUpdatedSubscription = this.$repository.onUpdated.subscribe((item) => {
			let found: number;

			// compare by ids to be able to use immutable entities
			for (let i = 0; i < this.data.length; i++) {
				if (item.id === this.data[i].id) {
					found = i;
					break;
				}
			}

			if (typeof found !== 'undefined') {
				this.data[found] = item;
				this.subject.next(this.data);
				this.onUpdated.emit(item);
			}
		});

		this.onRemovedSubscription = this.$repository.onRemoved.subscribe((item) => {
			const pos = this.data.indexOf(item);

			if (pos >= 0) {
				const item = this.data[pos];
				this.data.splice(pos, 1);
				this.subject.next(this.data);
				this.onRemoved.emit(item);
			}
		});

		this.onReplacedSubscriction = this.$repository.onReplaced.subscribe((item) => {
			let found: number;

			for (let i = 0; i < this.data.length; i++) {
				if (item.previous === this.data[i]) {
					found = i;
					break;
				}
			}

			if (typeof found !== 'undefined') {
				this.data[found] = item.next;
				this.subject.next(this.data);
				this.onReplaced.emit({
					previous: item.previous,
					next: item.next,
				});
			}
		});

		return this.subject;
	}

}
