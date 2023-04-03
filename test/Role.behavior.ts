import { expect, use } from "chai";
import { ethers } from "ethers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Role } from "../typechain-types";
import { Result } from "./types";

export function shouldBehaveLikeRoleCreate(): void {
    it("Should create a role", async function () {
        await createRole(this.role, this.signers.alice, 2, 1, 120, 5);
    })

    it("Should create a role with increasing id", async function () {
        await createRole(this.role, this.signers.alice, 1, 1, 80, 15);
        await createRole(this.role, this.signers.alice, 0, 2, 100, 10);
        await createRole(this.role, this.signers.bob, 2, 3, 120, 5);
    })
}

export function shouldBehaveLikeAttack(): void {
    it("Should decrease HP when attack", async function () {
        const roleId = 0;
        const enemyRoleId = 1;

        await createRole(this.role, this.signers.alice, 0, 1, 100, 10);
        await createRole(this.role, this.signers.bob, enemyRoleId, 2, 80, 15);

        await doAttack(this.role, this.signers.alice, 1, this.signers.bob, 2, 85, 70, Result.Pending);
    })
    
    it("Should attack util one of two is dead", async function () {
        const attackerRoleId = 0; // HP, ATK = 100, 10
        const defenderRoleId = 1; // HP, ATK = 80, 15

        const attackerId = 1;
        const defenderId = 2;

        const attacker = this.signers.alice;
        const defender = this.signers.bob;

        await createRole(this.role, attacker, attackerRoleId, attackerId, 100, 10);
        await createRole(this.role, defender, defenderRoleId, defenderId, 80, 15);

        await doAttack(this.role, attacker, attackerId, defender, defenderId, 85, 70, Result.Pending);
        // await doAttack(this.role, attacker, attackerId, defender, defenderId, 70, 60, Result.Pending);
        // await doAttack(this.role, attacker, attackerId, defender, defenderId, 55, 50, Result.Pending);
        // await doAttack(this.role, attacker, attackerId, defender, defenderId, 40, 40, Result.Pending);
        // await doAttack(this.role, attacker, attackerId, defender, defenderId, 25, 30, Result.Pending);
        // await doAttack(this.role, attacker, attackerId, defender, defenderId, 10, 20, Result.Pending);
        // await doAttack(this.role, attacker, attackerId, defender, defenderId, 0, 10, Result.DefenderWin);
    })

    it("Role 1 vs. role 2", async function () {
        const attackerRoleId = 1; // HP, ATK = 80, 15
        const defenderRoleId = 2; // HP, ATK = 120, 5

        const attackerId = 1;
        const defenderId = 2;

        const attacker = this.signers.alice;
        const defender = this.signers.bob;

        await createRole(this.role, attacker, attackerRoleId, attackerId, 80, 15);
        await createRole(this.role, defender, defenderRoleId, defenderId, 120, 5);

        // await doAttack(this.role, attacker, attackerId, defender, defenderId, 75, 105, Result.Pending);
        // await doAttack(this.role, attacker, attackerId, defender, defenderId, 70, 90, Result.Pending);
        // await doAttack(this.role, attacker, attackerId, defender, defenderId, 65, 75, Result.Pending);
        // await doAttack(this.role, attacker, attackerId, defender, defenderId, 60, 60, Result.Pending);
        // await doAttack(this.role, attacker, attackerId, defender, defenderId, 55, 45, Result.Pending);
        // await doAttack(this.role, attacker, attackerId, defender, defenderId, 50, 30, Result.Pending);
        // await doAttack(this.role, attacker, attackerId, defender, defenderId, 45, 15, Result.Pending);
        // await doAttack(this.role, attacker, attackerId, defender, defenderId, 45, 0, Result.AttackerWin);
    })
}

async function createRole(
    role: Role,
    to: SignerWithAddress,
    roleId: number,
    expectedTokenId: number,
    expectedHP: number,
    expectedATK: number
    ) {
    await expect(await role.connect(to).createRole(roleId))
    .to.emit(role, "RoleCreated")
    .withArgs(to.address, expectedTokenId, roleId);

    expect(await role.tokenIdToRoleIds(expectedTokenId))
    .to.equal(roleId, "Converting tokenId to roleId fails")

    expect(await role.getRoleHP(roleId))
    .to.equal(expectedHP, "unexpected role HP");

    expect(await role.getRoleATK(roleId))
    .to.equal(expectedATK, "unexpected role ATK");

    expect(await role.getHP(expectedTokenId))
    .to.equal(expectedHP, "unexpected HP");

    expect(await role.getATK(expectedTokenId))
    .to.equal(expectedATK, "unexpected ATK");
}

async function doAttack(
    role: Role,
    attacker: SignerWithAddress,
    attackerTokenId: number,
    defender: SignerWithAddress,
    defenderTokenId: number,
    expectedAttackerHP: number,
    expectedDefenderHP: number,
    res: Result
) {
    await expect(role.connect(attacker).attack(attackerTokenId, defenderTokenId))
    .to.emit(role, "Attacked")
    .withArgs(attackerTokenId, defenderTokenId, expectedAttackerHP, expectedDefenderHP, res);
}
