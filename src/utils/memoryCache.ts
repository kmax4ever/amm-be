const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 60, useClones: false });

export const get = (key: string) => {
    const data = myCache.get(key)
    return data;
}

export const set = (key: string, data: any, time = 30) => {
    myCache.set(key, data, time)
}


export const getPrice = (key: string) => {
    const data = myCache.get(key)
    return data;
}
export const memoryCache = (key, data) => {
    const result = get(key);
    if (data) {
        return result;
    }
    else {
        set(key, data);
    }

}