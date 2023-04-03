import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Signers } from "./types";
import { expect } from "chai";
import { ethers } from "hardhat";
import { shouldBehaveLikeAttack, shouldBehaveLikeRoleCreate } from "./Role.behavior";

describe("Role", function () {
    beforeEach(async function () {
        this.signers = {} as Signers;
    
        const signers = await ethers.getSigners();
        this.signers.admin = signers[0];
        [this.signers.alice, this.signers.bob, this.signers.carol, this.signers.devid] = signers.slice(1);

        const RoleFactory = await ethers.getContractFactory("Role");
        const roleContract = await RoleFactory.deploy('https://test.url.com');
        this.role = roleContract;
    });

    describe("Create a role", async function () {
        shouldBehaveLikeRoleCreate();
    })
    
    describe("Attack", function () {
        shouldBehaveLikeAttack();
    })
})