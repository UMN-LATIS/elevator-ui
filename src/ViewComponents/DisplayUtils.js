
export const clickToSearch = (widget, text) => {
    return text;
};

export const getField = (template, field) => {
    return template.widgetArray.filter(widget => widget.fieldTitle === field)[0];
}
