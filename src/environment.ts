import * as Crypto from 'crypto-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

export class Environment {
    private env: { [key: string]: string };
    private passEnv: string;
    private readerKey: Crypto.WordArray;
    constructor(prefix: string = '') {
        this.loadEnvironmentFile(prefix + '.env');
        this.loadPassEnvFile(prefix + '.passEnv');
    }

    private getReaderKey() {
        if (this.readerKey) return this.readerKey;
        const pkg = (JSON.parse(fs.readFileSync('package.json').toString()));
        const projectIdentfy = `${pkg.name || '' + pkg.description || '' + pkg.author || '' + pkg.license || ''}`;
        return this.readerKey = Crypto.HmacSHA256(this.env.ENV_VALIDADE_HASH, projectIdentfy);
    }

    private loadPassEnvFile(file: string) {
        this.passEnv = fs.readFileSync(file).toString();
        this.passEnv = Buffer.from(this.passEnv, 'base64').toString();

        const keyProject = this.getReaderKey();
        this.passEnv = Crypto.AES.decrypt(this.passEnv,
            Crypto.enc.Utf8.parse(keyProject.toString()),
            {
                iv: Crypto.enc.Utf8.parse(keyProject.iv), // parse the IV 
                padding: Crypto.pad.Pkcs7,
                mode: Crypto.mode.CBC
            }).toString(Crypto.enc.Utf8);
    }

    private loadEnvironmentFile(file: string) {
        const envVars = this.env = dotenv.parse(fs.readFileSync(file));
    }

    getValueByPropertyName(propertyName: string) {
        if (!this.passEnv || this.passEnv === '') return 'error';
        return Crypto.AES.decrypt(this.env[propertyName], this.passEnv.split(',')[0], {
            iv: this.passEnv.split(',')[1], // parse the IV 
            padding: Crypto.pad.Pkcs7,
            mode: Crypto.mode.CBC
        }).toString(Crypto.enc.Utf8);
    }

    getMapPropertiesValues(properties: string[]) {
        let propertiesValues: { [prop: string]: string } = {};
        properties.forEach(propertie => propertiesValues.propertie = this.getValueByPropertyName(propertie));
        return propertiesValues;
    }
}