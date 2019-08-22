const nameTicker = ({
    node = undefined,
    dataSource = [],
    tickSpeed = 5,
    pingSpeed = 8,
    ...rest
} = {}) => ({node, dataSource, tickSpeed, pingSpeed,
    init({
        NameStore = {},
        NameList = [],
        fetchNames = undefined,
        prepareNames = undefined,
        update = () => {
            try {
                this.addNames();
            }
            catch (e) {
                console.log(e);
            }
        },
        setURLValidation = regex => url => url.match(regex).length,
        addNames = () => {
            this.DonorList = this.DonorList.concat(this.fetchNames().filter(name => {
                if (!this.NameStore[name]) {
                    this.NameStore[name] = 1;
                    return true;
                }
            }));

            return this;
        },
        setNode = (node) => {
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
        },
        setFetch = (dataSource) => {
            if (typeof dataSource === 'function') {
                fetchNames = () => dataSource();
            }
            else if(Array.isArray(dataSource)) {
                fetchNames = () => dataSource;
            }
            else if(typeof dataSource === 'object') {
                fetchNames = () => prepareNames(dataSource);
            }
            else if(typeof dataSource === 'string') {
                this.validateDataSourceURL = setURLValidation(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm).bind(this, this.dataSource);
                if (this.validateDataSourceURL()) {
                    fetchNames = fetch(dataSource)
                    .then(names => names.json())
                    .then(names => names)
                    .catch(e => { throw e })
                }
            }
            else {
                throw new Error('nameTicker initialized without proper dataSource');
            }

            return this;
        },
        ...rest
    } = {}) {
        try {
            setNode(this.node);
            setFetch(this.dataSource);
        }
        catch(e) {
            console.log(e);
        }

        return this;
    },
    ...rest
});