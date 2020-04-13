class APIRequest {
    constructor({endpoint, data = "", callback}) {
        if (endpoint != undefined && callback != undefined) {
            this.endpoint = endpoint;
            this.data = data;

            this.xhr = new XMLHttpRequest();

            this.xhr.onload = () => {
                callback(this.xhr.responseText);
            };
            this.xhr.open("POST", endpoint);
            this.xhr.send(data);
        }
    }
}