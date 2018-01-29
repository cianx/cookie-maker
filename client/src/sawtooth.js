
// const {createContext, CryptoFactory} = require('sawtooth-sdk/signing');
const {createHash} = require('crypto')
//const {protobuf} = require('sawtooth-sdk/client')

//const { signer, TransactionEncoder, BatchEncoder} = require('sawtooth-sdk/client')

const {CryptoFactory, createContext } = require('sawtooth-sdk/signing')
const protobuf = require('sawtooth-sdk/protobuf')
const request = require('browser-request')



export class Sawtooth {
    constructor() {
        this.validatorUrl = "http://localhost:3000/api/"
        const context = createContext('secp256k1');
        const privateKey = context.newRandomPrivateKey();
        this.signer = new CryptoFactory(context).newSigner(privateKey);
        this.publicKey = this.signer.getPublicKey().asHex();
        console.log(this.publicKey);
    }

    sendTransaction(payload, fx) {

        // onsole.log(protobuf, protobuf.TransactionHeader);
        const payloadBytes = window.btoa(payload);

        // STEP 1 = TransactionHeader
        const transactionHeaderBytes = protobuf.TransactionHeader.encode({
            familyName: 'cookie-maker',
            familyVersion: '1.0',
            inputs: ['*'],
            outputs: ['*'],
            signerPublicKey: this.signer.getPublicKey().asHex(),
            nonce: "" + new Date().getTime(),
            batcherPublicKey: this.signer.getPublicKey().asHex(),
            dependencies: [],
            payloadSha512: createHash('sha512').update(payloadBytes).digest('hex')
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
        console.log(batchListBytes, payloadBytes);
        request.post({
            url: this.validatorUrl + 'batches',
            body: window.btoa(batchListBytes),
            headers: {'Content-Type': 'application/octet-stream'},
        }, (err, response) => {
            if (err) {console.log(err);}
            fx(err, response.body);
        });
        return batchSignature;
    }

    fixUrl(url) {
        return url.replace('http://localhost:3000/', this.validatorUrl);
    }
}