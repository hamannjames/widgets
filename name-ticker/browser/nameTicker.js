if (window.nameTicker === undefined) {
    window.nameTicker = ({
        node = undefined,
        dataSource = [],
        tickSpeed = 5,
        pingSpeed = 8,
        index = 0,
        willInit = (e) => { console.log('a nameTicker will initialize at ' + (node || 'undefined node')); return e.detail.ticker },
        didInit = (e) => { console.log(`a nameTicker did initialize at ${(node || 'undefined node')} at ${index}`); return e.detail.ticker },
        onTick = undefined,
        onPing = undefined,
        ...rest
    } = {}) => {
        let initialized = false;
        const initialState = {
            node,
            ...rest
        }
        return {...initialState,
            init({
                prepareNames = () => dataSource,
                URLRegex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm,
                ...rest
            } = {}) {
                if (initialized) {
                    throw new Error('nameTicker already initialized. Please use restart.')
                }
                let tick, ping, fetchNames;
                const NameStore = new Set();
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

                    initialized = true;

                    return this;
                }
                const addNames = (names) => {
                    if (!names || !names.length) {
                        throw 'No New Names';
                    }
                    names = names.filter(name => !NameStore.has(name));
                    if (!names.length) {
                        throw 'No New Names';
                    }
                    names.map(name => NameStore.add(name));
                    return this;
                }
                const eventHandler = function() {
                    let e = arguments[0];
                    try {
                        this.callbacks.forEach((cb, index) => {
                            if (typeof cb === 'function') {
                                
                                if (!cb(e)) {
                                    throw (e.type + ' event loop stopped at event ' + index);
                                }
                            }
                        })
                    }
                    catch (e) {
                        console.log(e);
                    }
                }

                const EventMap = new Map([
                    ['nameTicker.willInitialize', {handler: undefined, callbacks: [willInit]}],
                    ['nameTicker.didInitialize', {handler: undefined, callbacks: [didInit]}],
                    ['nameTicker.willTick', {handler: undefined, callbacks: []}],
                    ['nameTicker.didTick', {handler: undefined, callbacks: []}],
                    ['nameTicker.willPing', {handler: undefined, callbacks: []}],
                    ['nameTicker.didPing', {handler: undefined, callbacks: []}]
                ]);

                [...EventMap].forEach(event => {
                    EventMap.set(event[0], {
                        handler: eventHandler.bind(EventMap.get(event[0])),
                        callbacks: EventMap.get(event[0]).callbacks
                    });
                });

                const methods = {
                    updateNameStore() {
                        try {
                            addNames(fetchNames());
                        }
                        catch (e) {
                            console.log(e);
                        }
                        finally {
                            return this;
                        }
                    },
                    getNames() {
                        return [...NameStore];
                    },
                    setDataSource(data) {
                        try {
                            setFetch(data);
                        }
                        catch (e) {
                            console.log(e);
                        }
                    },
                    dispatch(event, ops = {}) {
                        try {
                            (this.node instanceof HTMLElement ? this.node : document).dispatchEvent(new CustomEvent(event, {
                                bubbles: true,
                                cancelable: true,
                                detail: {
                                    ticker: this,
                                    ...ops
                                }
                            }));
                            return this;
                        }
                        catch(e) {
                            console.log(e);
                        }
                    },
                    setNode(node, keep) {
                        if (node && (node = document.querySelector(node))) {
                            this.node = node;
                        }
                        else {
                            console.log('nameTicker assigned invalid node');
                        }

                        if (keep) {
                            return this;
                        }

                        this.dispatch('nameTicker.restart', Object.assign(initialState, {node, index: nextIndex}))
                    },
                    addCallbacks({...events} = {}) {
                        for (event of [...EventMap]) {
                            document.removeEventListener(event[0], EventMap.get(event[0]).handler);
                            let handlerObject = event[1];
                            if (events[event[0]] && typeof events[event[0]] === 'function') {
                                handlerObject.callbacks = events['prepend'] ? [events[event[0]]].concat(handlerObject.callbacks) : handlerObject.callbacks.concat([events[event[0]]]);
                                handlerObject.handler = eventHandler.bind(handlerObject.callbacks);
                                EventMap.set(event[0], {
                                    handlerObject
                                });
                            }
                            if (handlerObject.callbacks.length) {
                                document.addEventListener(event[0], EventMap.get(event[0]).handler);
                            }
                        }
                        return this;
                    },
                    setIndex(val) {
                        try {
                            return !isNaN(index = parseInt(val))
                        }
                        catch(e) {
                            console.log(e);
                        }
                    },
                    getIndex() {
                        return index;
                    }
                }
                
                document.removeEventListener('nameTicker.willInitialize', EventMap.get('nameTicker.willInitialize').handler);
                document.addEventListener('nameTicker.willInitialize', EventMap.get('nameTicker.willInitialize').handler);

                methods.dispatch.call(this, 'nameTicker.willInitialize');

                try {
                    return Object.assign(setFetch(dataSource), methods).setNode(this.node, true).addCallbacks().dispatch('nameTicker.didInitialize');
                }
                catch (e) {
                    console.log(e);
                }
            }
        }
    };
}