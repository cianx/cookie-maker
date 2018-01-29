
 import {HttpClient} from 'aurelia-fetch-client';

const {createHash} = require('crypto')
const {CryptoFactory, createContext } = require('sawtooth-sdk/signing')
const protobuf = require('sawtooth-sdk/protobuf')

function hash(v) {
    return createHash('sha512').update(v).digest('hex');
}

export class CookieMakerClient {
    constructor() {
        this.validatorUrl = window.document.location.href +"api/"
        this.client = new HttpClient();
        this.client.configure(
            config => {
                config.withBaseUrl('api/');
                config.withDefaults({
                  headers: {
                    'Content-Type': 'application/octet-stream',
                  }
                });
            });
        const context = createContext('secp256k1');
        const privateKey = context.newRandomPrivateKey();
        this.signer = new CryptoFactory(context).newSigner(privateKey);
        this.publicKey = this.signer.getPublicKey().asHex();
        this.address = hash("cookie-maker").substr(0, 6) +
            hash(this.publicKey).substr(64, 64);
        console.log(this.publicKey);
    }

    sendTransaction(payload, fx) {

        // onsole.log(protobuf, protobuf.TransactionHeader);
        var enc = new TextEncoder("utf-8");
        const payloadBytes = enc.encode(payload);

        const address = this.address

        // STEP 1 = TransactionHeader
        const transactionHeaderBytes = protobuf.TransactionHeader.encode({
            familyName: 'cookie-maker',
            familyVersion: '1.0',
            inputs: [address],
            outputs: [address],
            signerPublicKey: this.signer.getPublicKey().asHex(),
            nonce: "" + new Date().getTime(),
            batcherPublicKey: this.signer.getPublicKey().asHex(),
            dependencies: [],
            payloadSha512: hash(payloadBytes),
        }).finish();

        // STEP 2 - Transaction
        const transaction = protobuf.Transaction.create({
            header: transactionHeaderBytes,
            headerSignature: this.signer.sign(transactionHeaderBytes),
            payload: payloadBytes
        });

        // STEP 3 - BatchHeader
        const transactions = [transaction]
        const batchHeaderBytes = protobuf.BatchHeader.encode({
            signerPublicKey: this.signer.getPublicKey().asHex(),
            transactionIds: transactions.map((txn) => txn.headerSignature),
        }).finish();

        // STEP 4 - Batch
        const batchSignature = this.signer.sign(batchHeaderBytes);
        const batch = protobuf.Batch.create({
            header: batchHeaderBytes,
            headerSignature: batchSignature,
            transactions: transactions,
        });

        // STEP 5 - BatchList
        const batchListBytes = protobuf.BatchList.encode({
            batches: [batch]
        }).finish();

        // STEP 6 - Send to the validator
       this.client.fetch('batches', {
            method: 'post',
            body: batchListBytes
          })
          .then(response => response.json())
          .then(response => {
                if(response.link) {
                    response.link = this.fixUrl(response.link);
                }
                fx(null, response);
          })
          .catch(error => {
            fx(error, null);
          });
        return batchSignature;
    }

    fixUrl(url) {
        return url.replace('http://localhost:3000/', this.validatorUrl);
    }

    getMyState(fx) {
       this.client.fetch('state/' + this.address,
            {
            method: 'get',
          })
          .then(response => response.json())
          .then(response => {
                fx(response);
          })
          .catch(error => {
            console.log(error);
          });
    }

    getState(fx) {
       this.client.fetch('state', {
            method: 'get',
          })
          .then(response => response.json())
          .then(response => {
                fx(response);
          })
          .catch(error => {
            console.log(error);
          });
    }
}