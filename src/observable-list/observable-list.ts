import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';

import {ObservableEntity} from './observable-entity';
import {ObservableRepository} from './observable-repository';


export declare type ShouldIncludeNewEntity<T extends ObservableEntity> = (newEntity: T) => boolean;

function defaultShouldIncludeNewEntity(): boolean
{
	return true;
}


export class ObservableList<T extends ObservableEntity>
{


	private list: BehaviorSubject<Array<T>>;

	private onInsertedSubscription: Subscription;

	private onUpdatedSubscription: Subscription;

	private onRemovedSubscription: Subscription;

	private onReplacedSubscriction: Subscription;


	constructor(
		private $repository: ObservableRepository<T>,
	) {}


	public initList(list: Observable<Array<T>>, shouldIncludeNewEntity: ShouldIncludeNewEntity<T> = defaultShouldIncludeNewEntity): BehaviorSubject<Array<T>>
	{
		if (this.list) {
			this.disconnect();
		}

		return this.list = this.createList(list, shouldIncludeNewEntity);
	}


	public disconnect(): void
	{
		if (this.list) {
			this.onInsertedSubscription.unsubscribe();
			this.onUpdatedSubscription.unsubscribe();
			this.onRemovedSubscription.unsubscribe();
			this.onReplacedSubscriction.unsubscribe();

			this.list = undefined;
		}
	}


	private createList(list: Observable<Array<T>>, shouldIncludeNewEntity: ShouldIncludeNewEntity<T>): BehaviorSubject<Array<T>>
	{
		let collection: Array<T> = [];
		const subject = new BehaviorSubject(collection);

		list.subscribe((currentData) => {
			collection = currentData;
			subject.next(collection);
		});

		this.onInsertedSubscription = this.$repository.onInserted.subscribe((item) => {
			if (shouldIncludeNewEntity(item)) {
				collection.push(item);
				subject.next(collection);
			}
		});

		this.onUpdatedSubscription = this.$repository.onUpdated.subscribe((item) => {
			let found: number;

			// compare by ids to be able to use immutable entities
			for (let i = 0; i < collection.length; i++) {
				if (item.id === collection[i].id) {
					found = i;
					break;
				}
			}

			if (typeof found !== 'undefined') {
				collection[found] = item;
				subject.next(collection);
			}
		});

		this.onRemovedSubscription = this.$repository.onRemoved.subscribe((item) => {
			const pos = collection.indexOf(item);

			if (pos >= 0) {
				collection.splice(pos, 1);
				subject.next(collection);
			}
		});

		this.onReplacedSubscriction = this.$repository.onReplaced.subscribe((data) => {
			let found: number;

			for (let i = 0; i < collection.length; i++) {
				if (data.previous === collection[i]) {
					found = i;
					break;
				}
			}

			if (typeof found !== 'undefined') {
				collection[found] = data.next;
				subject.next(collection);
			}
		});

		return subject;
	}

}
