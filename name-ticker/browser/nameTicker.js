const nameTicker = ({
    node = document.getElementsByTagName('body')[0],
    dataSource = [],
    tickSpeed = 5,
    pingSpeed = 8,
    ...rest
}) => Object.assign({node, dataSource, tickSpeed, pingSpeed, ...rest}, {
    NameStore: {},
    NameList: [],
    fetchNames: undefined,
    prepareNames: undefined,
    update: undefined,
    validateURL: ((regex) => url => {console.log(regex); return (typeof url === 'string' && url.match(regex).length)})(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm),
    addNames() {
        this.DonorList = this.DonorList.concat(this.fetchNames().filter(name => {
            if (!this.NameStore[name]) {
                this.NameStore[name] = 1;
                return true;
            }
        }));

        return this;
    },
    init() {
        if (typeof this.dataSource === 'function') {
            this.fetchNames = () => this.dataSource();
        }
        else if(Array.isArray(this.dataSource)) {
            this.fetchNames = () => this.dataSource;
        }
        else if(typeof this.dataSource === 'object') {
            this.fetchNames = () => this.prepareNames(dataSource);
        }
        else if(this.validateURL(this.dataSource)) {
            this.fetchNames = () => {
                fetch(dataSource)
                .then(names => names.json())
                .then(names => names)
                .catch(e => { throw e })
            }
        }
        else {
            throw new Error('nameTicker initialized without a valid dataSource');
        }
    }
})