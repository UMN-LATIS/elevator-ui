declare global {
    interface Window { baseURL: string; }
}

export const getBaseURL = () => {
    return window.baseURL??"/";
}

export const getField = (template, field) => {
    return template.widgetArray.filter(widget => widget.fieldTitle === field)[0];
}
