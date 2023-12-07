// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MultiSig {
     uint8 private constant maxMember = 5;// This State Can be omited Or chnged as per requriment if omited please remove it from constructor other will create error
    address public owner;
    address[] public owners;
    uint public transactionCount;
    uint public memberAddCount;
    uint8 public required;
    uint8 public newMemberAddRRequire;
   

    struct Transaction {
        address payable destination;
        uint value;
        bool executed;
        bytes data;
    }
    // to track transactions
    mapping(uint => Transaction) public transactions;
    // to track new member add
    mapping(uint => address) public numberToAddRequest;
     // to track confirmation for trasaction to execute
    mapping(uint => mapping(address => bool)) public tConfirmations;
    // to track confirmation for member to add
    mapping(uint => mapping(address => bool)) public newMemConfirmations;
    // to track who has added fund
    mapping(address => uint) public fundersAmount;

    constructor(
        address[] memory _owners,
        uint8 _confirmations,
        uint8 _newMemberAddRRequire
    ) {
        // If No has Added At time Of contract deployment
        if(_owners.length<=0){
            required = _confirmations;
            newMemberAddRRequire = _newMemberAddRRequire;
            owner = msg.sender;
        }
        //If owners have Added At time Of contract deployment
        else{
            require(owners.length<=maxMember);
            require(_confirmations > 0);
            require(_confirmations <= _owners.length);
            owners = _owners;
            required = _confirmations;
            newMemberAddRRequire = _newMemberAddRRequire;
            owner = msg.sender;
        }
        
       
    }
    // To Receive Fund In the contarct And Map the Amount To Depositor
    receive() external payable {
        fundersAmount[msg.sender] += msg.value;
    }

    // on Suucesstfull Confrimation transaction To Execute
    function executeTransaction(uint transactionId) public {
        require(isConfirmed(transactionId));
        Transaction storage _tx = transactions[transactionId];
        require(_tx.value<= address(this).balance,"More Than Contract Balance");
        (bool success, ) = _tx.destination.call{value: _tx.value}(_tx.data);
        require(success);
        _tx.executed = true;
    }
     // Check If The Transaction has Gotten Enoug Vote To exectute Or Not
    function isConfirmed(uint transactionId) public view returns (bool) {
        return getConfirmationsCount(transactionId) >= required;
    }

    // Count How Many Vote HAs A transaction has Gotten
    function getConfirmationsCount(
        uint transactionId
    ) public view returns (uint) {
        uint count;
        for (uint i = 0; i < owners.length; i++) {
            if (tConfirmations[transactionId][owners[i]]) {
                count++;
            }
        }
        return count;
    }

    // Check If The Caller Is The One The Owner Of The Contract  Or Not
    function isOwner(address addr) private view returns (bool) {
        for (uint i = 0; i < owners.length; i++) {
            if (owners[i] == addr) {
                return true;
            }
        }
        return false;
    }
    
    // Submits The Transaction To Contract And Also Confrims The Trasaction By The Submitter
    function submitTransaction(
        address payable dest,
        uint value,
        bytes calldata _data
    ) external {
        require(isOwner(msg.sender) || msg.sender == owner, "Only Owner can Submit Transactions");
        uint id = addTransaction(dest, value, _data);
        confirmTransaction(id);
    }

    // Confirms the transaction byt the onwers of the contract
    function confirmTransaction(uint transactionId) public {
        require(isOwner(msg.sender));
        tConfirmations[transactionId][msg.sender] = true;
        if (isConfirmed(transactionId)) {
            executeTransaction(transactionId);
        }
    }
    // Adds Transactions But Not Does Not Confirm
    // It is Better and Fast to use submitTransaction() in case of hurry as that(submitTransaction()) confirms also 
    function addTransaction(
        address payable destination,
        uint value,
        bytes calldata _data
    ) public returns (uint) {
        require(isOwner(msg.sender));
        transactions[transactionCount] = Transaction(
            destination,
            value,
            false,
            _data
        );
        transactionCount += 1;
        return transactionCount-1;
    }

    // From Here Functionatites for adding Members;


    // Adds member request but does not confirm adding
    function addOwnersRequest(address new_owner) public returns (uint) {
        require(msg.sender == owner || isOwner(msg.sender), "Only Contract Owner And Contract Members Can Add New Members");
        require((isOwner(new_owner))!= true, "Member Already Exists");
        require((owners.length < 10), "No Slot Available");
        numberToAddRequest[memberAddCount] = new_owner;
        memberAddCount += 1;
        return memberAddCount-1;
    }
    // on SuccesFull Confirmation adds new owners to the contract
    function addOwners(uint _addId) internal {
        require(isConfirmToAddMember(_addId), "Not Confrimed Yet");
        owners.push(numberToAddRequest[_addId]);
    }

    // submits add equest and confirms add request.
    function submitAddRequest(address memberToAdd) external {
        require(msg.sender == owner || isOwner(msg.sender), "Only Contract Owner And Contract Members Can Add New Members");
        uint addId = addOwnersRequest(memberToAdd);
        confirmAdding(addId);
    }

    // Confirms adding by the owners
    function confirmAdding(uint _addId) public {
        require((isOwner(msg.sender) || msg.sender == owner), "Only Existing Member Can Call This");

        newMemConfirmations[_addId][msg.sender] = true;

        if (isConfirmToAddMember(_addId)) {
            addOwners(_addId);
        }
    }

  
    // check confirmation 
    // this fuction behave diifrent if the contract is deployed without zero member or less than newMemberAddRRequire members
    // is added athe time deployment 
    // if zero or less thas newMemberAddRRequire members is added at time of deployment
    // then the contract will allow to add member by the owner until  newMemberAddRRequire numbers of mebrs is added then confirmation 
    // can be triggered
    function isConfirmToAddMember(uint _addId) internal view returns (bool) {
        if(owners.length<newMemberAddRRequire){
            return true;
        }else{
            return getMemberAddConfirmationCount(_addId) >= newMemberAddRRequire;
        }
        
    }

    // Check How Many confirmation a member adding request is got
    function getMemberAddConfirmationCount(
        uint _addId
    ) internal view returns (uint) {
        uint count;
        for (uint256 i = 0; i < owners.length; i++) {
            if (newMemConfirmations[_addId][owners[i]]) {
                count++;
            }
        }
        return count;
    }


    // Only for Test Purposes
    function getOwners() public view returns (address[] memory ){
        require(isOwner(msg.sender) || msg.sender == owner);
        return owners;
    }

}
