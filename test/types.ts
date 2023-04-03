import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Role } from '../typechain-types/contracts/Role';

declare module "mocha" {
    export interface Context {
      signers: Signers;
      role: Role;
    }
}

export interface Signers {
    admin: SignerWithAddress; // Usualy admin is a deployer of contracts.
    // Ususaly these signers are users which call deployed contracts.
    alice: SignerWithAddress;
    bob: SignerWithAddress;
    carol: SignerWithAddress;
    devid: SignerWithAddress;
    // Potential users are here.
    [user: string]: SignerWithAddress | undefined | null;
}

export enum Result {
    Unkown,
    Pending,
    AttackerWin,
    DefenderWin
}