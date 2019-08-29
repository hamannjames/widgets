if (window.nameTicker === undefined) {
    window.nameTicker = ({
        node = undefined,
        dataSource = [],
        tickSpeed = 5,
        pingSpeed = 8,
        ...rest
    } = {}) => ({node, tickSpeed, pingSpeed,
        init({
            prepareNames = () => dataSource,
            URLRegex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm,
            ...rest
        } = {}) {
            const NameStore = new Set();
            let fetchNames = undefined;
            const setFetch = (data) => {
                if (typeof data === 'function') {
                    fetchNames = () => dataSource();
                }
                else if(Array.isArray(data)) {
                    fetchNames = () => data;
                }
                else if(typeof data === 'object') {
                    fetchNames = () => prepareNames(data);
                }
                else if(typeof data === 'string') {
                    try {
                        data.match(URLRegex).length;
                        fetchNames = () => {
                            fetch(data)
                            .then(names => names.json())
                            .then(names => names)
                            .catch(e => { throw e })
                        }
                    }
                    catch (e) {
                        throw new Error('nameTicker initialized without valid URL String');
                    }
                }
                else {
                    throw new Error('nameTicker initialized without proper dataSource');
                }

                return this;
            }
            const update = () => {
                try {
                    this.addNames(fetchNames());
                }
                catch (e) {
                    console.log(e);
                }
            }

            try {
                setFetch(dataSource);
            }
            catch (e) {
                console.log(e);
            }

            const methods = {
                addNames(names) {
                    if (!names || !names.length) {
                        throw 'No New Names';
                    }
                    names = names.filter(name => !NameStore.has(name));
                    if (!names.length) {
                        throw 'No New Names';
                    }
                    names.map(name => NameStore.add(name));
                    return this;
                },
                getNames() {
                    return NameStore;
                },
                setDataSource(data) {
                    try {
                        setFetch(data);
                    }
                    catch (e) {
                        console.log(e);
                    }
                },
                setNode(node) {
                    if (!node) {
                        throw new Error('setNode called without a valid node element or selector');
                    }

                    if (!(node instanceof HTMLElement)) {
                        node = document.querySelector(node);

                        if (!node) {
                            throw new Error('setNode called without a valid node element or selector');
                        }
                    }

                    this.node = node;

                    return this;
                }
            }

            return {...this, ...methods};
        },
        ...rest
    });
}