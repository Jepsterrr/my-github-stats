import {enableTailwind} from '@remotion/tailwind';
import {WebpackOverrideFn} from '@remotion/bundler';

export const webpackOverride: WebpackOverrideFn = (currentConfiguration) => {
	const configWithTailwind = enableTailwind(currentConfiguration);

	return {
		...configWithTailwind,
		resolve: {
			...configWithTailwind.resolve,
			fallback: {
				...configWithTailwind.resolve?.fallback,
				fs: false,
				path: false,
				os: false,
			}
		}
	}
};
