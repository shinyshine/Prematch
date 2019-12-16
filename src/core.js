// 提供rematch plugin支持
import store from './prematchStore';

const all = {
    plugins: []
};

const merge = (original = {}, next = {}) => ({ ...next, ...original });

const mergeConfig = initConfig => {
    const config = {
        name: initConfig.name,
        models: {},
        plugins: [],
        ...initConfig,
    };

    config.plugins.forEach(plugin => {
        if (plugin.config) {
            // 合并plugin的models
            const models = merge(config.models, plugin.config.models);
            config.models = models;
        }
    });

    return config;
};

const forEachPlugin = (method, fn) => {
    all.plugins.forEach(plugin => {
        if (plugin[method]) {
            fn(plugin[method]);
        }
    });
};

const addModel = model => {
    store.model(model);
    forEachPlugin('onModel', (onModel) => onModel.call(store, model));
};

const getModels = models => {
    return Object.keys(models).map(name => ({
        name,
        ...models[name],
        reducers: models[name].reducers || {},
    }))
}

export default function init(initConfig = {}) {
    const config = mergeConfig({ ...initConfig });
    const { plugins = [] } = config;
    const models = getModels(config.models);
    all.plugins = plugins;
    for (const model of models) {
        addModel(model)
    }

    const rematchStore = { ...store, model: addModel };

    forEachPlugin('onStoreCreated', (onStoreCreated) => {
        const returned = onStoreCreated.call(rematchStore, rematchStore);
        // 如果onStoreCreated返回一个object
        // 合并这个object到store上
        if (returned) {
            Object.keys(returned || {}).forEach((key) => {
                rematchStore[key] = returned[key];
            });
        }
    });
    return rematchStore;
}
