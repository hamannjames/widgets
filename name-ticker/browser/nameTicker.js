if (window.nameTicker === undefined) {
    window.nameTicker = ({
        node = undefined,
        dataSource = [],
        tickSpeed = 5,
        pingSpeed = 8,
        willInit = () => {console.log('will init')},
        didInit = (e) => {console.log(`nameTicker initialized at ${(node || 'undefined node')}`); return true},
        onTick = undefined,
        onPing = undefined,
        ...rest
    } = {}) => {
        const initialState = {
            node,
            tickSpeed,
            pingSpeed,
            ...rest
        }
        return {...initialState,
            init({
                prepareNames = () => dataSource,
                URLRegex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm,
                ...rest
            } = {}) {
                let nextIndex = 0;
                let ping = undefined;
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
                    console.log(event);
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
                            this.node.dispatchEvent(new CustomEvent(event, {
                                bubbles: true,
                                cancelable: true,
                                detail: {
                                    ticker: this,
                                    ...ops
                                }
                            }));
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

                        this.dispatch('nameTicker.restart', Object.assign(initialState, {node}))
                    },
                    addCallbacks({...events} = {}) {
                        for (event of [...EventMap]) {
                            document.removeEventListener(event[0], EventMap.get(event[0]).handler);
                            if (events[event[0]] && typeof events[event[0]] === 'function') {
                                let callbacks = {
                                    callbacks: events['prepend'] ? [events[event[0]]].concat(event[1].callbacks) : event[1].callbacks.concat([events[event[0]]])
                                }
                                EventMap.set(event[0], {
                                    callbacks: callbacks.callbacks,
                                    handler: eventHandler.bind(callbacks)
                                });
                            }
                            document.addEventListener(event[0], EventMap.get(event[0]).handler);
                        }
                        return this;
                    }
                }

                try {
                    if (this.dispatch) {
                        this.dispatch('nameTicker.willInitialize');
                    }
                    Object.assign(setFetch(dataSource), methods).setNode(this.node, true).addCallbacks();
                    this.dispatch('nameTicker.didInitialize');
                    return this;
                }
                catch (e) {
                    console.log(e);
                }
            }
        }
    };
}