import {ObservableList} from '../../src';
import {ObservableRepositoryMock, ObservableEntityMock} from '../mocks';
import {expect} from 'chai';
import {BehaviorSubject, from as ObservableFrom} from 'rxjs';
import {map} from 'rxjs/operators';


let repository: ObservableRepositoryMock;
let list: ObservableList<ObservableEntityMock>;


describe('#ObservableList', () => {

	beforeEach(() => {
		repository = new ObservableRepositoryMock;
		list = new ObservableList<ObservableEntityMock>(repository);
	});

	describe('initList()', () => {

		it('should create new list', () => {
			const first = list.initList(ObservableFrom([]));
			const second = list.initList(ObservableFrom([]));

			expect(first).to.be.an.instanceOf(BehaviorSubject);
			expect(second).to.be.an.instanceOf(BehaviorSubject);
			expect(first).to.not.be.eq(second);
		});

	});

	describe('onInsertedSubscription', () => {

		it('should emit updated collection with new entity', () => {
			const subject = list.initList(ObservableFrom([]));
			const collections: Array<Array<ObservableEntityMock>> = [];

			subject.subscribe((collection) => {
				collections.push(cloneCollection(collection));
			});

			const entity_1 = new ObservableEntityMock(1);
			const entity_2 = new ObservableEntityMock(2);

			repository.insert(entity_1);
			repository.insert(entity_2);

			expect(collections).to.be.eql([
				[],
				[entity_1],
				[entity_1, entity_2],
			]);
		});

		it('should should not insert new entity into collection', () => {
			list = new ObservableList<ObservableEntityMock>(repository, (newEntity) => newEntity.id === 2);

			const subject = list.initList(ObservableFrom([]));
			const collections: Array<Array<ObservableEntityMock>> = [];

			subject.subscribe((collection) => {
				collections.push(cloneCollection(collection));
			});

			const entity_1 = new ObservableEntityMock(1);
			const entity_2 = new ObservableEntityMock(2);

			repository.insert(entity_1);
			repository.insert(entity_2);

			expect(collections).to.be.eql([
				[],
				[entity_2],
			]);
		});

	});

	describe('onUpdatedSubscription', () => {

		it('should not emit new collection if updated entity is not in previous collection', () => {
			const subject = list.initList(ObservableFrom([]));
			const collections: Array<Array<ObservableEntityMock>> = [];

			subject.subscribe((collection) => {
				collections.push(cloneCollection(collection));
			});

			repository.update(new ObservableEntityMock(1));

			expect(collections).to.be.eql([
				[],
			]);
		});

		it('should emit new collection if entity was updated', () => {
			const subject = list.initList(ObservableFrom([]));
			const collections: Array<Array<ObservableEntityMock>> = [];

			subject.subscribe((collection) => {
				collections.push(cloneCollection(collection));
			});

			const entity = new ObservableEntityMock(1);

			repository.insert(entity);
			repository.update(entity);

			expect(collections).to.be.eql([
				[],
				[entity],
				[entity],
			]);

			expect(entity).to.not.be.eq(collections[2][0]);
		});

	});

	describe('onRemovedSubscription', () => {

		it('should not emit new collection if removed entity is not in previous collection', () => {
			const subject = list.initList(ObservableFrom([]));
			const collections: Array<Array<ObservableEntityMock>> = [];

			subject.subscribe((collection) => {
				collections.push(cloneCollection(collection));
			});

			const entity = new ObservableEntityMock(1);

			repository.remove(entity);

			expect(collections).to.be.eql([
				[],
			]);
		});

		it('should emit new collection after entity was removed', () => {
			const subject = list.initList(ObservableFrom([]));
			const collections: Array<Array<ObservableEntityMock>> = [];

			subject.subscribe((collection) => {
				collections.push(cloneCollection(collection));
			});

			const entity = new ObservableEntityMock(1);

			repository.insert(entity);
			repository.remove(entity);

			expect(collections).to.be.eql([
				[],
				[entity],
				[],
			]);
		});

	});

	describe('onReplacedSubscription()', () => {

		it('should not emit new collection if replaced entity is not in previous collection', () => {
			const subject = list.initList(ObservableFrom([]));
			const collections: Array<Array<ObservableEntityMock>> = [];

			subject.subscribe((collection) => {
				collections.push(cloneCollection(collection));
			});

			repository.replace(new ObservableEntityMock(1), new ObservableEntityMock(1));

			expect(collections).to.be.eql([
				[],
			]);
		});

		it('should emit new collection if entity was replaced', () => {
			const entity1 = new ObservableEntityMock(1);
			const entity2 = new ObservableEntityMock(2);
			const entity3 = new ObservableEntityMock(3);

			const entity2_updated = new ObservableEntityMock(22);

			const subject = list.initList(ObservableFrom([[
				entity1,
				entity2,
				entity3,
			]]));

			const collections: Array<Array<ObservableEntityMock>> = [];

			subject.subscribe((collection) => {
				collections.push(cloneCollection(collection));
			});

			repository.replace(entity2, entity2_updated);

			expect(collections).to.be.eql([
				[entity1, entity2, entity3],
				[entity1, entity2_updated, entity3],
			]);
		});

	});

	describe('disconnect()', () => {

		it('should disconnect all event emitters from repository', () => {
			const subject = list.initList(ObservableFrom([]));
			const collections: Array<Array<ObservableEntityMock>> = [];

			subject.subscribe((collection) => {
				collections.push(cloneCollection(collection));
			});

			list.disconnect();

			const entity = new ObservableEntityMock(1);

			repository.insert(entity);
			repository.update(entity);
			repository.remove(entity);

			expect(collections).to.be.eql([
				[],
			]);
		});

	});

	describe('reload()', () => {

		it('should refresh all data', () => {
			const entity_1 = new ObservableEntityMock(1);
			const entity_2 = new ObservableEntityMock(2);
			const entity_3 = new ObservableEntityMock(3);
			const entity_4 = new ObservableEntityMock(4);

			const collections: Array<Array<ObservableEntityMock>> = [];
			const subject = list.initList(ObservableFrom([
				[
					entity_1,
					entity_2,
				],
			]));

			subject.subscribe((collection) => {
				collections.push(cloneCollection(collection));
			});

			expect(collections).to.be.eql([
				[entity_1, entity_2],
			]);

			list.reload(ObservableFrom([
				[
					entity_3,
					entity_4,
				],
			]));

			expect(collections).to.be.eql([
				[entity_1, entity_2],
				[entity_3, entity_4],
			]);
		});

	});

	describe('modify()', () => {

		it('should modify items', () => {
			const items = [
				new ObservableEntityMock(1),
				new ObservableEntityMock(2),
				new ObservableEntityMock(3),
				new ObservableEntityMock(4),
			];

			const collections: Array<Array<ObservableEntityMock>> = [];
			const subject = list.initList(ObservableFrom([
				[items[0], items[1]],
			]));

			subject.subscribe((collection) => {
				collections.push(cloneCollection(collection));
			});

			expect(collections).to.be.eql([
				[items[0], items[1]],
			]);

			list.modify((observableItems) => {
				return observableItems.pipe(
					map((item) => items[item.id + 1]),
				);
			});

			expect(collections).to.be.eql([
				[items[0], items[1]],
				[items[2], items[3]],
			]);
		});

	});

});


function cloneCollection(collection: Array<ObservableEntityMock>): Array<ObservableEntityMock>
{
	const copy = [];

	for (let i = 0; i < collection.length; i++) {
		copy.push(collection[i]);
	}

	return copy;
}
