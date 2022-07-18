import axios from "axios";

declare global {
    interface Window { baseURL: string; }
}

export const getBaseURL = () => {
    return window.baseURL??"/";
}

export const getField = (template, field) => {
    return template.widgetArray.filter(widget => widget.fieldTitle === field)[0];
}

export const getTinyURL = (fileObjectId) => {
    return getBaseURL() + "fileManager/getDerivativeById/" + fileObjectId + "/tiny2x";
};

export const getThumbURL = (fileObjectId) => {
    return getBaseURL() + "fileManager/getDerivativeById/" + fileObjectId + "/thumbnail2x";
};

export const getAssetLink = (objectId) => {
    return getBaseURL() + "asset/viewAsset/" + objectId;
}

export const getRelatedAssetTitle = (relatedAssetTitleCache) => {
    if(relatedAssetTitleCache && relatedAssetTitleCache.length > 0) {
        return relatedAssetTitleCache[0];
    }
    else {
        return "(no title)";
    }
}

export const getAsset = (assetId: string) => {
    return axios.get(getBaseURL() + "asset/viewAsset/" + assetId + "/true")
        .then(res => {
            return res.data;
        })
        .catch(err => {
            // todo
            alert(err);
        });
}

export const getTemplate = (templateId: string) => {
    return axios.get(getBaseURL() + "assetManager/getTemplate/" + templateId)
        .then(res => {
            return res.data;
        })
        .catch(err => {
            // todo
            alert(err);
        });
}