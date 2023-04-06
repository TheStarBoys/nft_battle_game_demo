// contracts/Role.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Role is Ownable, ERC721URIStorage {
    event Attacked(uint indexed attacker, uint indexed defender, uint attackerHP, uint defenderHP, Result res);
    event RoleCreated(address indexed player, uint tokenId, uint roleId);

    enum Result {
        Unkown,
        Pending,
        AttackerWin,
        DefenderWin
    }

    using Counters for Counters.Counter;
    using Strings for uint;
    Counters.Counter private _tokenIds;
    mapping(uint => uint) public tokenIdToRoleIds; // tokenId => roleId
    mapping(uint => uint) public tokenHPs; // tokenId => HP
    string baseUri;
    uint[2][3] public roles = [[100, 10], [80, 15], [120, 5]]; // [HP, ATK]

    constructor(string memory _baseUri) ERC721("Role", "R") {
        baseUri = _baseUri;
    }

    function attack(uint yourId, uint enemyId) public {
        require(ownerOf(yourId) == msg.sender, "!owner");
        uint yourHP = tokenHPs[yourId];
        require(yourHP > 0, "you're dead");
        uint enemyHP = tokenHPs[enemyId];
        require(enemyHP > 0, "enemy is dead");

        uint yourATK = roles[tokenIdToRoleIds[yourId]][1];
        uint enemyATK = roles[tokenIdToRoleIds[enemyId]][1];
        enemyHP = enemyHP >= yourATK ? enemyHP - yourATK : 0;
        tokenHPs[enemyId] = enemyHP;
        if (enemyHP == 0) { // you win
            emit Attacked(yourId, enemyId, yourHP, enemyHP, Result.AttackerWin);
            return;
        }

        yourHP = yourHP >= enemyATK ? yourHP - enemyATK : 0;
        tokenHPs[yourId] = yourHP;
        if (yourHP == 0) { // enemy win.
            emit Attacked(yourId, enemyId, yourHP, enemyHP, Result.DefenderWin);
            return;
        }
        emit Attacked(yourId, enemyId, yourHP, enemyHP, Result.Pending);
    }

    function getHP(uint tokenId) public view returns(uint) {
        return tokenHPs[tokenId];
    }

    function getATK(uint tokenId) public view returns(uint) {
        return roles[tokenIdToRoleIds[tokenId]][1];
    }

    function getRoleHP(uint roleId) public view returns(uint) {
        return roles[roleId][0];
    }

    function getRoleATK(uint roleId) public view returns(uint) {
        return roles[roleId][1];
    }

    function setBaseURI(string memory _baseUri) public onlyOwner {
        baseUri = _baseUri;
    }

    function _baseURI() internal view override virtual returns (string memory) {
        return baseUri;
    }

    function createRole(uint roleId) public returns(uint tokenId) {
        return _createRole(msg.sender, roleId);
    }

    function _createRole(address player, uint roleId)
        internal
        returns (uint256)
    {
        require(roleId <= 2, "invalid roleId");
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        tokenIdToRoleIds[newItemId] = roleId;
        _mint(player, newItemId);
        _setTokenURI(newItemId, string(abi.encodePacked("/", roleId.toString())));
        tokenHPs[newItemId] = getRoleHP(roleId);
        emit RoleCreated(player, newItemId, roleId);
        return newItemId;
    }

    function roleIdToURI(uint roleId) public view returns(string memory) {
        return string(abi.encodePacked(_baseURI(), "/", (roleId+1).toString()));
    }
}