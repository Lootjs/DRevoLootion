<template>
	<Component v-if="isReady" :is="layout">
		<RouterView />
	</Component>
</template>

<script>
import { ref, inject, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout';
import { ClientService } from '@/services/client';
import { AuthService } from '@/services/auth';
import { RahmetApp } from '@/services/rahmet';
import { Analytics, events } from '@/services/analytics';
import { getQueryByName } from '@/utils/functions';
import { useI18n } from 'vue-i18n';

const initTown = () => {
	const town = getQueryByName('town_id');
	if (town) {
		ClientService.setTownId(+town);
	}
};

const initPlatformAndVersion = () => {
	const platform = getQueryByName('platform');
	const version = getQueryByName('v');

	if (platform && version) {
		ClientService.setPlatform(platform);
		ClientService.setVersion(version);
	}
};

const authorize = async () => {
	const trackId = getQueryByName('track_id');

	if (trackId) {
		await AuthService.authByTrackId(trackId);
		return;
	}

	if (AuthService.isAuthorized() && RahmetApp.isWebView()) {
		AuthService.logout();
	}
};

const sendInitEvent = () => {
	let isFirstOpen = false;
	const deviceId = getQueryByName('device_id');
	const savedDeviceId = window.localStorage.getItem('deviceId') || '';

	if (deviceId && savedDeviceId !== deviceId) {
		isFirstOpen = true;
		window.localStorage.setItem('deviceId', deviceId);
	}

	Analytics.logEvent(events.MINI_APP_OPENED, {
		is_first_open: isFirstOpen
	});
};

export default {
	name: 'App',
	setup() {
		const { t } = useI18n();
		const isReady = ref(false);
		const toast = inject('$toast');
		const route = useRoute();
		const router = useRouter();
		const layout = computed(() => {
			return route.meta.layout || DefaultLayout;
		});

		watch(
			() => route,
			() => {
				if (route.fullPath.includes('//') && route.params.pathMatch.length) {
					const path = route.params.pathMatch.join('/');
					router.push(path);
				}
			},
			{ deep: true }
		);

		ClientService.setGeoRejectedCallback(() => {
			toast.info({
				title: t('geo.geoRejectedTitle'),
				text: t('geo.geoRejectedText')
			});
		});

		initTown();
		initPlatformAndVersion();

		return {
			isReady,
			layout
		};
	},

	// globalProperties нельзя вытащить в Сomposition API,
	// поэтому приходится писать часть кода в mounted()
	async mounted() {
		try {
			const initMetrika = (callback = () => {}) => {
				if (this.$metrika) {
					return callback();
				}

				const yandexKey = process.env.VUE_APP_YANDEX_KEY;
				document.addEventListener(`yacounter${yandexKey}inited`, callback);
			};

			const setUserIdToMetrika = () => {
				const userId = AuthService.getUserId();
				if (userId) {
					this.$metrika.userParams({ UserId: userId });
				}
			};

			this.$loader.on();
			await authorize();
			initMetrika(setUserIdToMetrika);
			await ClientService.initCoordinatesIfGranted();
			this.$loader.off();

			if (RahmetApp.isWebView()) {
				RahmetApp.applicationBecomeActive(ClientService.initCoordinatesIfGranted); // prettier-ignore
			}

			sendInitEvent();
		} catch (error) {
			this.$loader.off();
			this.$toast.error({ title: error.message });
		} finally {
			this.isReady = true;
		}
	}
};
</script>
