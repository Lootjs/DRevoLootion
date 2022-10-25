<template>
	<div class="pt-4 pb-6">
		<div class="mb-4 px-4">
			<UiSwitcher :default-id="defaultServiceId" @select="changeService">
				<UiSwitcherItem :id="SERVICES.takeaway.id">С собой</UiSwitcherItem>
				<UiSwitcherItem :id="SERVICES.express.id">В ресторане</UiSwitcherItem>
			</UiSwitcher>
		</div>

		<UiLoader v-if="isLoading" size="md" box />
		<template v-else>
			<!-- Список категорий -->
			<CategoryList :offset="144" class="mb-4" />

			<!-- Повтор заказа -->
			<section
				v-if="repeatFilialsCategory.filials.hasResults()"
				class="px-4 mb-6"
			>
				<UiHeading class="mb-6">{{ $t('categories.recentOrders') }}</UiHeading>

				<div class="flex justify-between">
					<FilialCard
						v-for="filial in repeatFilialsCategory.filials.results"
						:key="filial.id"
						:filial="filial"
						:category="repeatFilialsCategory.name"
						class="home-repeat-card"
					/>
				</div>
			</section>

			<!-- Заведения рядом/популярные -->
			<section class="px-4">
				<UiHeading class="mb-6">
					{{ $t(activeCategory.title) }}
				</UiHeading>

				<UiInfiniteScroll
					loader-type="lebedev"
					:is-loading="isLoadingMore"
					@infinite="loadMore"
				>
					<FilialCard
						v-for="filial in activeCategory.filials.results"
						:key="filial.id"
						:filial="filial"
						:category="activeCategory.name"
						size="lg"
						class="mb-6 last:mb-0"
					/>
				</UiInfiniteScroll>
			</section>

			<!-- Bottom Sheet (Выбор города) -->
			<UiBottomSheet
				ref="pickTownSheet"
				shift-color="#D4D3DF"
				closeable
				@closed="disableTownPicker"
			>
				<template #title>{{ $t('base.pickTown') }}{{ $t('categories.recentOrders') }}</template>
				<NavigatorTownPicker @close="closePickTownSheet" />
			</UiBottomSheet>
		</template>

		<BaseNavigation />
	</div>
</template>

<script>
import { ref, inject, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import BaseNavigation from '@/components/base/BaseNavigation';
import CategoryList from '@/components/category/CategoryList';
import FilialCard from '@/components/filial/FilialCard';
import NavigatorTownPicker from '@/components/navigator/NavigatorTownPicker';
import UiHeading from '@/components/ui/UiHeading';
import UiLoader from '@/components/ui/UiLoader';
import UiInfiniteScroll from '@/components/ui/UiInfiniteScroll';
import UiBottomSheet from '@/components/ui/UiBottomSheet';
import { UiSwitcher, UiSwitcherItem } from '@/components/ui/UiSwitcher';
import { ClientService } from '@/services/client';
import { NavigatorService } from '@/services/navigator';
import { Analytics, events } from '@/services/analytics';
import { SERVICES } from '@/utils/constants';

/**
 * @module views/Home
 * @vue-computed {object} activeCategory - Активная категория
 */
export default {
	name: 'Home',
	components: {
		BaseNavigation,
		CategoryList,
		FilialCard,
		NavigatorTownPicker,
		UiHeading,
		UiLoader,
		UiInfiniteScroll,
		UiBottomSheet,
		UiSwitcher,
		UiSwitcherItem
	},
	setup() {
		const { t } = useI18n();
		const defaultServiceId = NavigatorService.state.service.id;

		// prettier-ignore
		const popularFilialsCategory =
			NavigatorService.state.popularFilialsCategory;
		const nearFilialsCategory = NavigatorService.state.nearFilialsCategory;
		const repeatFilialsCategory = NavigatorService.state.repeatFilialsCategory;

		const isLoading = ref(false);
		const isLoadingMore = ref(false);
		const pickTownSheet = ref(null);
		const toast = inject('$toast');
		// const loader = inject('$loader');
		const disableSearch = inject('disableSearch');
		const setSearchClickHandler = inject('setSearchClickHandler');
		const setSearchUpdateHandler = inject('setSearchUpdateHandler');
		const setSearchSubmitHandler = inject('setSearchSubmitHandler');
		const setSearchCancelHandler = inject('setSearchCancelHandler');
		const setLangChangedHandler = inject('setLangChangedHandler');
		const router = useRouter();
		toast.info({
				title: t('geo.geoRejectedTitle'),
				text: t('geo.geoRejectedText')
			});
		const activeCategory = computed(() => {
			if (ClientService.hasCoordinates()) {
				return nearFilialsCategory;
			}

			return popularFilialsCategory;
		});

		/**
		 * Изменение объекта последнего заказа
		 * @param {object} order
		 */
		const parseFrequentOrder = order => {
			const key = Object.keys(order)[0];

			return {
				id: key,
				items: order[key]
			};
		};

		/**
		 * Первоначальный вызов филиалов
		 */
		const initCall = async () => {
			if (!activeCategory.value.filials.hasResults()) {
				isLoading.value = true;
			}

			try {
				await NavigatorService.initAllFilials();

				requestAnimationFrame(() => {
					if (NavigatorService.needDeterminateTown(activeCategory.value)) {
						openPickTownSheet();
					}
				});
			} catch (error) {
				toast.error({ title: error.message });
			} finally {
				isLoading.value = false;
			}
		};

		const changeService = id => {
			NavigatorService.clearAllFilials();
			NavigatorService.setServiceById(id);
			initCall();
		};

		watch(
			() => ClientService.state.coordinates,
			() => {
				NavigatorService.clearAllFilials();
				initCall();
			},
			{ deep: true }
		);

		/**
		 * Открыть выбор города
		 */
		const openPickTownSheet = () => {
			Analytics.logEvent(events.TOWN_APPEARED, {
				current_town: ClientService.state.townId
			});

			pickTownSheet.value?.open();
		};

		/**
		 * Закрыть выбор города
		 */
		const closePickTownSheet = () => {
			NavigatorService.disableTownPicker();
			pickTownSheet.value?.hide();
		};

		const loadMoreCb = {
			onStart: () => (isLoadingMore.value = true),
			onFinish: () => (isLoadingMore.value = false),
			onError: error => toast.error({ title: error.message })
		};

		/**
		 * Загрузка новых страниц активной категории
		 */
		const loadMore = () => {
			NavigatorService.loadMoreFilials(activeCategory.value, loadMoreCb);
		};

		/**
		 * Изменение глобального заголовка
		 */
		const changeTitle = () => {
			ClientService.setTitle(t('base.takeaway'));
		};

		changeTitle();
		disableSearch(true);
		setSearchClickHandler(() => router.push({ name: 'Search' }));
		setSearchUpdateHandler(null);
		setSearchSubmitHandler(null);
		setSearchCancelHandler(null);
		setLangChangedHandler(changeTitle);

		onMounted(() => initCall());
		onBeforeUnmount(() => setLangChangedHandler(null));

		return {
			defaultServiceId,
			repeatFilialsCategory,
			activeCategory,
			isLoading,
			isLoadingMore,
			changeService,
			pickTownSheet,
			parseFrequentOrder,
			loadMore,
			closePickTownSheet,
			disableTownPicker: NavigatorService.disableTownPicker,
			SERVICES
		};
	}
};
</script>

<style lang="scss" scoped>
.home-repeat-card {
	width: calc(50% - 0.25rem);
}
</style>
