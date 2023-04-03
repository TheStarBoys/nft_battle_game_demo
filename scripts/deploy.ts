import { ethers } from "hardhat";

async function main() {
  const baseURI = "https://app.bueno.art/api/contract/nwufnF46unE0aJTh7MQN6/chain/1/metadata";
  const Role = await ethers.getContractFactory("Role");
  const role = await Role.deploy(baseURI);

  await role.deployed();

  console.log(
    `Role deployed to ${role.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
