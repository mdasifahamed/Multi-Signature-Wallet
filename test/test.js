const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture, deployContract } = require('ethereum-waffle')

async function signers() {
  const [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();
  return { owner, user1, user2, user3, user4, user5 }
}



describe("Deploy without members", async () => {
  async function deployContract() {
    const requiredVoteForTrx = 3;
    const requiredVoteForAdd = 3;
    let members = []
    const { owner } = await signers();
    const Contract = await ethers.getContractFactory('MultiSig');
    const MultiSig = await Contract.connect(owner).deploy(members, requiredVoteForTrx, requiredVoteForAdd);

    return { MultiSig };
  }

  it('Should deploy With Zero Members But Must Add Vote For Trx And Vote For Add', async () => {
    const { MultiSig } = await loadFixture(deployContract);

    expect(await MultiSig.required()).to.be.equal(3);
    expect(await MultiSig.newMemberAddRemoveRequire()).to.be.equal(3);

  })
})

describe("Try To Deploy without members also Without Votre For trx AnD Vote For Add ", async () => {
  async function deployContract() {
    const requiredVoteForTrx = null;
    const requiredVoteForAdd = null;
    let members = []
    const { owner } = await signers();
    const Contract = await ethers.getContractFactory('MultiSig');
    const MultiSig = await Contract.connect(owner).deploy(members, requiredVoteForTrx, requiredVoteForAdd);

    return { MultiSig };
  }

  it('Should Not deploy With Zero  Vote For Trx And Vote For Add', async () => {
    try {
      const { MultiSig } = await loadFixture(deployContract);
    } catch (error) {
      expect(error);
    }

  })
})

describe(" Deploy With Members Also with  Votre For trx AnD Vote For Add ", async () => {
  async function deployContract() {
    const requiredVoteForTrx = 3;
    const requiredVoteForAdd = 3;
    const { user1, user2, user3, user4, user5 } = await signers()
    let members = [user1.address, user2.address, user3.address, user4.address, user5.address]
    const { owner } = await signers();
    const Contract = await ethers.getContractFactory('MultiSig');
    const MultiSig = await Contract.connect(owner).deploy(members, requiredVoteForTrx, requiredVoteForAdd);

    return { MultiSig };
  }

  it('Should Deploy With Members And Set It to  the Array', async () => {
    const { MultiSig } = await loadFixture(deployContract);
    const { owner, user1, user2 } = await signers();
    const walletowners = await MultiSig.connect(user1).getOwners();

    expect(walletowners[0]).to.be.equal(user1.address);
    expect(walletowners[1]).to.be.equal(user2.address);

  })
})



// Use Case Tests 
describe("Wallet Transactions Tests", async () => {
  async function deployContract() {
    const requiredVoteForTrx = 3;
    const requiredVoteForAdd = 3;
    const { user1, user2, user3, user4, user5 } = await signers()
    let members = [user1.address, user2.address, user3.address, user4.address, user5.address]
    const { owner } = await signers();
    const Contract = await ethers.getContractFactory('MultiSig');
    const MultiSig = await Contract.connect(owner).deploy(members, requiredVoteForTrx, requiredVoteForAdd);

    return { MultiSig };
  }

  it('Contract Should Except Balance And Set it To Its Funders According to thier Funds ', async () => {
    const { MultiSig } = await loadFixture(deployContract);
    const { user1 } = await signers();
    try {
      await user1.sendTransaction({
        value: ethers.utils.parseEther('10'),
        to: MultiSig.address,
      })
    } catch (error) {
      console.log(error);
    }

    expect(await ethers.provider.getBalance(MultiSig.address)).to.be.equal(ethers.utils.parseEther('10'));
    expect(await MultiSig.fundersAmount(user1.address)).to.be.equal(ethers.utils.parseEther('10'));

  })

  it('Only Owners Can Add Transactions For Spend To Contract ', async () => {
    const { MultiSig } = await loadFixture(deployContract);
    const { owner, user3 } = await signers();
    const reciever = await ethers.getSigner(8);
    let trxId = null;

    try {

      // here used Addtransaction method of the contract 
      // which does not confirm at time time of adding 

      expect(await MultiSig.connect(user3).addTransaction(reciever.address, ethers.utils.parseEther('2'), [])).to.be.not.reverted;
    } catch (error) {
      console.log(error);
    }

    try {
      await MultiSig.connect(owner).addTransaction(reciever.address, ethers.utils.parseEther('2'), [])
    } catch (error) {
      expect(error);
    }



    const transaction = await MultiSig.transactions(0);



    expect(transaction.destination).to.be.equal(reciever.address);
    expect(transaction.executed).to.be.equal(false);

  })
  it("Owner Can Add And Confrim transaction At time of Adding transactions using submitTransacttion() method", async ()=>{

    const receiver2 = await ethers.getSigner(9);

    const {MultiSig} = await loadFixture(deployContract);

    const {user2} = await signers();

      // here used submitTransaction () method of the contract 
      // which confirms transaction by who is addign the transaction  at time time of adding 
    
    try {
      await MultiSig.connect(user2).submitTransaction(receiver2.address,ethers.utils.parseEther('2'),[]);
    } catch (error) {
      console.log(error);
    }
    

    const transaction = await MultiSig.transactions(1);
 
    
  

    expect(transaction.destination).to.be.equal(receiver2.address);
    expect(transaction.executed).to.be.equal(false);

    expect(await MultiSig.tConfirmations(1,user2.address)).to.be.equal(true);
   

  });
  it('Only Owners Should Approve/ Vote For Transactions', async ()=>{
    const outApprover = await ethers.getSigner(10);
    const{MultiSig} = await loadFixture(deployContract);
    try {
      await MultiSig.connect(outApprover).confirmTransaction(0)
    } catch (error) {
      expect(error);
    }
  })

  it('On Successfull Confrimation Transaction Should be executed', async ()=>{
      const {user1,user2,user3} = await signers();
      const{MultiSig} = await loadFixture(deployContract);
      const trxbfrconfrim = await MultiSig.transactions(0)

      expect(trxbfrconfrim.executed).to.be.equal(false);
      try {
        await MultiSig.connect(user1).confirmTransaction(0)
        await MultiSig.connect(user2).confirmTransaction(0)
        await MultiSig.connect(user3).confirmTransaction(0)
      } catch (error) {
        console.log(error);
      }
     
      const trxafrconfrim = await MultiSig.transactions(0)
      expect(trxafrconfrim.executed).to.be.equal(true);

  })
  it("Shloud Not Execute More Than Contract Holding Blanace", async()=>{
    const {user1,user2,user3} = await signers();
    const {MultiSig} = await loadFixture(deployContract);
    const receiver3 = await  ethers.getSigner(11);

    try {
      // submit and confrim transaction
      expect(await MultiSig.connect(user1).submitTransaction(receiver3.address, ethers.utils.parseEther('15'),[])).to.be.not.reverted;
    } catch (error) {
      console.log(error);
    }

    const trxbfcon = await MultiSig.transactions(2);
    expect(trxbfcon.executed).to.be.equal(false);

    // Confirm requiured confirmation   try Execute
    
    try{
      await MultiSig.connect(user2).confirmTransaction(2);
      await MultiSig.connect(user3).confirmTransaction(2);
    }
    catch(err){
      expect(err); //"More Than Contract Balance"
    }

    const trxafcon = await MultiSig.transactions(2);

    expect(trxafcon.executed).to.be.equal(false);

  })



})

// Test For Deploy Without Member Then Add New Members


describe("Test For Deploy Without Member Then Add New Members", async()=>{
   async function deployContract(){
    const requiredVoteForTrx = 3;
    const requiredVoteForAdd = 3;
    let members = []
    const {owner} = await signers();
    const contract = await ethers.getContractFactory('MultiSig');
    const MultiSig = await contract.connect(owner).deploy(members,requiredVoteForTrx,requiredVoteForAdd);
    return{MultiSig};
   }

   it("Should Deploy Wtihout Members and Set Contract Owner,requiredVoteForTrx,requiredVoteForAdd", async()=>{
      const {MultiSig} = await loadFixture(deployContract);
      const {owner} = await signers();

      expect(owner.address).to.be.equal(await MultiSig.owner());
      expect(await MultiSig.required()).to.be.equal(3);
      expect(await MultiSig.newMemberAddRemoveRequire()).to.be.equal(3);
   })

   // A Crucial Part Of The Contract As When When deploy Contract Contract WithOut A Set of Members
   // For Voting Members Are Absent An To Confirm New Member And ToConfirm transaction We Need Vote 
   // Of The Member But As The Contract Has Been Deployed Without The Members 
   // It Means Wee Cannot Add member Becasuse There Is Not Any Member Is The Contract Righ Now To Vote
   // For Confrimation For The Adding New Members Then How Can It Be Possible To Add Members?

   // One The Solution Is Use SubmitAddRequestMethod() which Can be Call Via Only The Contrac Owner
   // And Owners / Members Of The Contract And that will Executed ultilThe RequiredmemberVote For Adding
   // Then WithOut Confrimaion No One Can Add New New Members

   it("Should Be Able to Add New Members WithOut Confrimation by the Contract Owner Utill The Total Member Reaches Required Member To Vote For Add", async ()=>{
    const {owner, user1, user2, user3, user4} = await signers();
    const {MultiSig} = await loadFixture(deployContract);

    try {
      await MultiSig.connect(owner).submitAddRequest(user1.address);
    } catch (error) {
      console.log(error);
    }
     const members = await MultiSig.connect(owner).getOwners()

     expect(members[0]).to.be.equal(user1.address);
   })

   it("After Adding First Members To Contract By The Owner That Member(The First Member) Should Able To Add New Member Via SubmitAddRequest", async()=>{
    const {user1, user2,user3} = await signers();
    const {MultiSig } = await loadFixture(deployContract);

    try {
      await MultiSig.connect(user1).submitAddRequest(user2.address);
      //As user 2 is Added He Has aslo rigth to add New Without Confrimatiion till required
      // Member to vote To add is fillled
      await MultiSig.connect(user2).submitAddRequest(user3.address);
    } catch (error) {
      console.log(error);
    }
    const members = await MultiSig.connect(user1).getOwners()

    expect(members[1]).to.be.equal(user2.address);
    expect(members[2]).to.be.equal(user3.address);

  
   })

   it("direct Adding After Required Number Of Member To Vote For Add Is Filled Then Direct Add Should Not Work", async ()=>{

    const {user1, user4,user3, user2} = await signers();
    const {MultiSig} = await loadFixture(deployContract);

    try {
      await MultiSig.connect(user1).submitAddRequest(user4.address)
    } catch (error) {
      console.log(error);
    }


    const members = await MultiSig.connect(user1).getOwners()

    // As We Have Added Last Three 3 Mmbers The Should be Three Not The Four
    // Above request Should be Confirmed by More Two Mmebr To Add because 
    // requirem vote is 3 to add new member on is given througth submitrequest
    // two more needed
    expect(members.length).to.be.equal(3);
    

    try {
      await MultiSig.connect(user2).confirmAdding(3)
      await MultiSig.connect(user3).confirmAdding(3)
    } catch (error) {
      console.log(error);
    }

    // Now Fourth member should be added

    const members2 = await MultiSig.connect(user1).getOwners();

    expect(members2.length).to.be.equal(4);
    expect(members2[3]).to.be.equal(user4.address);

   })

   it("No member Should Be Added Than Max Member In Our Case Is Maximum 5 Can Added And No One Other Member or Contract Owner Can Confirm And Add Member", async()=>{

    const {user1, user3, user4, user5} = await signers();
    const extraMember = await ethers.getSigner(13);
    const outsider = await ethers.getSigner(14);
    const {MultiSig} = await loadFixture(deployContract);

    try {
      await MultiSig.connet(outsider).addOwnersRequest(user5.address)
    } catch (error) {
      expect(error)
      
    }

    const member = await MultiSig.getOwners();

    expect(member.length).to.be.equal(4);

    try {
     expect(await MultiSig.connect(user3).addOwnersRequest(user5.address)).to.be.not.reverted;
    } catch (error) {
      console.log(error);
      
    }

     try {
       await MultiSig.connect(outsider).confirmAdding(4)
     } catch (error) {
       expect(error);

     }
     try {
        await MultiSig.connect(user1).confirmAdding(4)
        await MultiSig.connect(user3).confirmAdding(4)
        await MultiSig.connect(user4).confirmAdding(4)
     } catch (error) {
      console.log(error);
     }

     const members2 = await MultiSig.getOwners();

      expect(members2.length).to.be.equal(5);

      // till Now We Have 5 Members And We expect a error when adding a New Member

     try {
      await MultiSig.connect(user1).addOwnersRequest(extraMember.address);
    } catch (error) {
      expect(error);

    }
 



   })


   it("Transactions Should be Done As Per Wallet Rule Be Sure To Be Exectued", async ()=>{
      const {user1, user2, user3, user4} = await signers();
      const {MultiSig} = await loadFixture(deployContract);
      const outsider = await ethers.getSigner(19);
      const receiver = await ethers.getSigner(18);

      try {
        await MultiSig.connect(outsider).submitTransaction(receiver.address, ethers.utils.parseEther('2'),[])
      } catch (error) {
         expect(error)
      }

      try {
        expect(await MultiSig.connect(user1).submitTransaction(receiver.address, ethers.utils.parseEther('2'),[])).to.be.not.reverted;
      } catch (error) {
        console.log(error);
      }
      
      const transaction = await MultiSig.transactions(0)

      expect(transaction.executed).to.be.equal(false)
      expect(transaction.destination).to.be.equal(receiver.address);
      
      // try toConfirm Transatcion From outsied And Expect A Error

      try {
        await MultiSig.connect(outsider).confirmTransaction(0)
      } catch (error) {
        
        expect(error);
      }

      // Add Some Balance to Contract That transaction Can be Done Succes fully

      try {
        await user1.sendTransaction({
          value: ethers.utils.parseEther('5'),
          to: MultiSig.address
        });
      } catch (error) {
        console.log(error);
      }


      expect(await ethers.provider.getBalance(MultiSig.address)).to.be.equal(ethers.utils.parseEther('5'))

      // now confirm transaction excuted transaction
      try {
        await MultiSig.connect(user2).confirmTransaction(0);
        await MultiSig.connect(user3).confirmTransaction(0);
      } catch (error) {
          console.log(error);        
      }

      const trx = await MultiSig.transactions(0);

      expect(trx.executed).to.be.equal(true);

      expect(await ethers.provider.getBalance(MultiSig.address)).to.be.equal(ethers.utils.parseEther('3'));
   })

})