import getParentElement from './functions/getParentElement';
import renderModal from './functions/renderModal';
import totalAmount from './functions/totalAmount';
import dataAttributesNames from './functions/dataAttributesNames';
import dataAttributesValues from './functions/dataAttributesValues';

export default class EasyCart {
    constructor(source, 
                productWrap = 'product__wrap', 
                addToCartBtn = 'addtocart',
                wrapperCartID = 'counterCart',
                modalClass = 'modal',
                modalClasses = {}) {
        this.source = source;
        this.productWrap = productWrap;
        this.addToCartBtn = addToCartBtn;
        this.wrapperCartID = wrapperCartID;
        this.modalClass = modalClass;
        this.modalClasses = {
            overlay: 'modal--overlay',
            popup: 'modal--popup',
            modalClose: 'modal--close',
            modalContent: 'modal--content',
            modalHeader: 'modal-header',
            modalBody: 'modal-body',
            removeBtn: 'remove--product',
            acceptBtn: 'accept__order',
            totalAmount: 'total--amount',
            totalCount: 'total--count'
        }
        this.cart = {};
        this.dataAttributesNames = [];
        this.currentProduct = {};
        this._build();
    }
    _build(){
        // localStorage.clear();
        this._setCart();
        this._handleClickAddToCart();
        this._renderCartCounter();
        this._handleClickCartCounter();
    }
    _setCart(){
        if (typeof localStorage.cart !== 'undefined') {
            this.cart = JSON.parse(localStorage.cart);
        } else {
            this.cart['total'] = 0;
            this.cart['items'] = {};
            this.cart['ids'] = [];
        }
    }
    _renderCartCounter(){
        let wrapperCart = document.getElementById(this.wrapperCartID);
        wrapperCart.innerHTML = this.cart.total;
    }
    _handleClickAddToCart(){
        let allBtnsAddToCart = document.querySelectorAll(`.${this.addToCartBtn}`);
        allBtnsAddToCart.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                let parentElem = getParentElement(e.target, this.productWrap);
                if(typeof parentElem !== 'undefined') {
                    this._getDataAttributes(parentElem);
                    this._updateCart();
                }
            });
        });
    }
    _handleClickCartCounter(){
        const wrapperCart = document.getElementById(this.wrapperCartID);
        wrapperCart.addEventListener('click', (e) => {
            let modal = document.querySelector(`.${this.modalClass}`);
            let html = renderModal(this.modalClasses, this.cart);
            modal.innerHTML = html;
            modal.style.display = 'block';
            this._handleClickCloseModal();
            this._handleOnchangeCount();
            this._handleClickRemoveProduct();
            this._handleClickOnAcceptOrder();
        });
    }
    _handleClickCloseModal() {
        let closeBtn = document.querySelector(`.${this.modalClasses.modalClose}`);
        if(closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                let modal = document.querySelector(`.${this.modalClass}`);
                modal.style.display = 'none';
                modal.innerHTML = '';
            });
        }
    }
    _handleOnchangeCount(){
        let inputCount = document.querySelectorAll(`.${this.modalClass} input[type="number"]`);
        inputCount.forEach(input => {
            input.addEventListener('input', (e) => {
                let id = +e.target.dataset.prod;
                this.cart.items[id].count = +e.target.value;
                this._updateTotalCountWhenRemove();
                this._updateStorage();
                this._updateTotalAmountAndCount();
            })
        });
    }
    _handleClickRemoveProduct(){
        let removeBtn = document.querySelectorAll(`.${this.modalClass} .${this.modalClasses.removeBtn}`);
        removeBtn.forEach(btn => {
            btn.addEventListener('click', (e) => {
                let id = +e.target.dataset.id;
                this.cart.ids.splice(this.cart.ids.indexOf(id),1);
                delete this.cart.items[id];
                this._updateTotalCountWhenRemove();
                this._updateStorage();
                e.target.parentElement.parentElement.remove();
                this._updateTotalAmountAndCount();
            });
        });
    }
    _handleClickOnAcceptOrder(){
        let btn = document.querySelector(`.${this.modalClass} .${this.modalClasses.acceptBtn}`);
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if(typeof this.source !== 'undefined'){
                fetch(this.source, {
                    method: "POST",
                    body: JSON.stringify(this.cart.items),
                    headers: {"Content-type":"application/json"}
                })
                    .then(response => {
                        if (response.status !== 200) {
                            return Promise.reject();
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log(data);
                    });
            } else {
                console.log(this.cart.items);
            }
        });
    }
    _getDataAttributes(parentElement){
        dataAttributesNames(this.dataAttributesNames, parentElement);
        dataAttributesValues(this.dataAttributesNames, this.currentProduct, parentElement);
    }
    _updateCart(){
        let cart = this.cart;
        let currentProd = this.currentProduct;
        if(cart.ids.indexOf(currentProd.id) !== -1){
            cart.items[currentProd.id].count += currentProd.count;
        } else {
            this.cart.ids.push(currentProd.id);
            this.cart.items[currentProd.id] = currentProd;
        }
        this._updateTotalCount();
        this._updateStorage();
    }
    _updateStorage(){
        localStorage.cart = JSON.stringify(this.cart);
        this.currentProduct = {};
        this._renderCartCounter();
    }
    _updateTotalCount(){
        this.cart.total += +this.currentProduct.count;
    }
    _updateTotalCountWhenRemove(){
        let total = 0;
        this.cart.ids.forEach(id => {
            total += this.cart.items[id].count;
        });
        this.cart.total = total;
    }
    _updateTotalAmountAndCount(){
        let modalAmount = document.querySelector(`.${this.modalClass} .${this.modalClasses.totalAmount}`);
        let modalCount = document.querySelector(`.${this.modalClass} .${this.modalClasses.totalCount}`);
        modalAmount.innerHTML = `Общая стоимость: ${totalAmount(this.cart)}`;
        modalCount.innerHTML = `Общее кол-во: ${this.cart.total}`;
    }
}
