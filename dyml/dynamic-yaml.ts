import yargs, { Arguments } from 'yargs';
import * as chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';
export class DynamicYAML {
    constructor() { }

    public async initialize() {
        const args = yargs(process.argv.slice(2)).scriptName(chalk.yellow('DYML'))
            .usage("Usage: $0 -d string -j string").options({
                s: { type: 'string', alias: 'source', demandOption: true },
                d: { type: 'string', alias: 'destination', default: process.cwd() },
                j: { type: 'string', alias: 'jsonSource', demandOption: true }
            }).describe("help", "HELP")
            .describe("version", "0.0.1")
            .epilog("copyright 2020").argv;
        try {
            await this.changeYAML(args.s, args.d, args.j);
        }
        catch (err) {
            console.log(err);
        }

    }

    async changeYAML(source: string, destination: string, jsonSource: string) {
        var sourcePath: string = this.constructPath(source);
        var destinationPath: string = this.constructPath(destination);
        var jsonPath: string = this.constructPath(jsonSource);
        var sourceVal: string;
        var jsonVal: { [index: string]: string };
        var readPromises: Array<Promise<string>> = [];
        var keyMap = new Map<string, string>();
        readPromises.push(new Promise((resolve, reject) => {
            fs.readFile(sourcePath, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                }
                resolve(data);
            })
        }));
        readPromises.push(new Promise((resolve, reject) => {
            fs.readFile(jsonPath, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                }
                resolve(data);
            })
        }));

        await Promise.all(readPromises).then((values) => {
            sourceVal = values[0],
                jsonVal = JSON.parse(values[1]);
        }).catch((err) => { throw err });

        for (let key in jsonVal) {
            keyMap.set(key, jsonVal[key]);
        }
        this.convertFile(sourceVal, keyMap, destinationPath);
    }

    convertFile(input: string, keyMap: Map<string, string>, destinationPath: string) {
        let newInput: string = "";
        const START = "{{";
        const END = "}}";
        let count = -1;
        let value: string;
        let slice = "";
        newInput += input[0];
        for (let i = 1; i < input.length; i++) {
            if (input[i - 1] + input[i] === START) {
                for (let j = i + 1; j < input.length; j++) {
                    count++;
                    if (input[j - 1] + input[j] === END) {
                        break;
                    }
                }
                console.log(i + 1, count + 1);
                slice = input.slice(i + 1, i + count);
                if (keyMap.has(slice)) {
                    value = keyMap.get(slice);
                    newInput += value;
                }
                else {
                    throw "Key not found"
                }
                i = i + count + 2;
                count = -1;
            }
            else {
                newInput += input[i];
            }
        }
        fs.writeFile(destinationPath + '/test.yaml', newInput, (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
    }

    constructPath(p: string): string {
        return path.isAbsolute(p) ? p : path.resolve(p);
    }
}
