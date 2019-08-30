if (window.nameTicker === undefined) {
    window.nameTicker = ({
        node = undefined,
        dataSource = [],
        tickSpeed = 5,
        pingSpeed = 8,
        willInit = undefined,
        didInit = undefined,
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
                const handleWillInit = (e) => {
                    EventMap.get('nameTicker.willInitialize').callbacks.forEach(cb => {
                        if (cb === 'function') {
                            cb(e);
                        }
                    })
                }
                const handleDidInit = (e) => {
                    try {
                        EventMap.get('nameTicker.DidInitialize').callbacks.forEach(cb => {
                            if (cb === 'function') {
                                cb(e);
                                if (e.cancelBubble) {
                                    throw (e);
                                }
                            }
                        })
                    }
                    catch(e) {
                        console.log(e);
                    }
                }
                const EventMap = new Map([
                    ['nameTicker.willInitialize', {handler: handleWillInit, callbacks: [willInit]}],
                    ['nameTicker.didInitialize', {handler: handleDidInit, callbacks: [didInit]},
                    ['nameTicker.willTick', [onTick]],
                    ['nameTicker.didTick', []],
                    ['nameTicker.willPing', [onPing]],
                    ['nameTicker.didPing', []]
                ]);

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
                                    callback: EventMap.get(event).handle,
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
                            if (events[event[0]] && typeof events[event[0]] === 'function') {
                                (this.node || document).removeEventListener()
                                EventMap.set(event[0], event[1].concat([events[event[0]]]));
                            }
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