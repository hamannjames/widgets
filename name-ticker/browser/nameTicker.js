const nameTicker = ({
    node = document.getElementsByTagName('body')[0],
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
        ...rest
    } = {}) {
        if (typeof this.dataSource === 'function') {
            fetchNames = () => this.dataSource();
        }
        else if(Array.isArray(this.dataSource)) {
            fetchNames = () => this.dataSource;
        }
        else if(typeof this.dataSource === 'object') {
            fetchNames = () => prepareNames(this.dataSource);
        }
        else if(typeof this.dataSource === 'string') {
            this.validateDataSourceURL = setURLValidation(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm).bind(this, this.dataSource);
            if (this.validateDataSourceURL()) {
                fetchNames = () => {
                    fetch(this.dataSource)
                    .then(names => names.json())
                    .then(names => names)
                    .catch(e => { throw e })
                }
            }
        }
        else {
            throw new Error('nameTicker initialized without a valid dataSource');
        }

        return this;
    },
    ...rest
});

let ticker = nameTicker().init();