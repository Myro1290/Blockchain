const Hotel = artifacts.require("Hotel");
const web3 = require('web3');

contract("Hotel", async(accounts) => {
  let hotelInstance;
  let hotelId;
  let address;
  beforeEach( async() => {
    hotelInstance = await Hotel.deployed();
    [owner,alice,bob] = accounts;
    hotelId = 1;
    address = await hotelInstance.address;
  });
  console.log(address);
  it("gets deployed successfully", async() => {
    return assert(hotelInstance,"Contract deployed successfully");
  });
  console.log(address);
  it('can add a new hotel', async() => {
    let balance;
    const amount = await web3.utils.toWei("0.00043","ether");
    balance = await web3.eth.getBalance(owner);
    console.log("Owner Balance," ,web3.utils.BN(balance));
    const newHotel = {
        id:hotelId,
        name:"Crypto Hotel",
        numOfRooms:10,
        description:"Some dummy crypto hotel name",
        location:"Kasarani, Nairobi - kenya",
        date: new Date().getTime(),
        hotelType:1,
        photo:"https://ipfs.infura.io/5373hshsjssjjg637fffkk"
    };
    const result = await hotelInstance.addHotel(
      newHotel.numOfRooms,
      newHotel.name,
      newHotel.description,
      newHotel.location,
      newHotel.photo,
      {from:alice, value:amount});

      const totalHotels = await hotelInstance.totalHotels();
      const listingFee = await hotelInstance.hotelListingFee();

      assert(result.receipt.status,true);
      assert(result.logs[0].args.causer, alice);
      assert.equal(totalHotels,1);
      assert.equal(listingFee, amount);
  });

  it('can set listing fee', async() => {
      const fee = await hotelInstance.hotelListingFee();
      const result = await hotelInstance.setListingFee(10,{from:owner});
      const newFee = await hotelInstance.hotelListingFee();

      assert.equal(result.receipt.status,true);
      assert(fee !== result,"Fee Changed Successfully");
      assert.equal(newFee,10);
      assert(result.logs[0].args.user,owner);
      assert(result.logs[0].args.fee,newFee);
  });

  it('should change a hotel category', async() => {
      const hotel = await hotelInstance.hotelItemId(hotelId);
      const currentCategory = hotel.hotelCategory;
      const hotelOwner = hotel.user;
      console.log(currentCategory.toNumber());

      const result = await hotelInstance.changeHotelCategory(hotelId,1,{from:alice});
      const modifiedHotel = await hotelInstance.hotelItemId(hotelId);
      const newlyChangedCategory = modifiedHotel.hotelCategory;

      assert(result.receipt.status, true);
      assert(currentCategory !== newlyChangedCategory);
      assert.equal(hotelOwner, alice);
      assert(result.logs[0].args.causer,alice);
      assert(result.logs[0].args.newCategory,newlyChangedCategory);
  });

  it('should ensure that only a hotel owner changes a hotel category for a hotel they own', async() => {
    try{
      const hotel = await hotelInstance.hotelItemId(hotelId);
      const hotelOwner = hotel.user;
      const result = await hotelInstance.changeHotelCategory(hotelId,1,{from:bob});

      assert(hotelOwner !== bob,"Unauthorized user is trying to change a category for a hotel they do not own");
    }catch(e){
      assert(e.message.includes("You Do Not Own This Hotel Item"));
      return;
    }
    assert(false);
  });

  it('should enable a hotel owner to change hotel ownership to a new address', async() => {
    const result = await hotelInstance.changeHotelOwner(bob,hotelId,{from:alice});
    const hotel = await hotelInstance.hotelItemId(hotelId);

    assert(result.receipt.status,true);
    assert(hotel.user,bob);
    assert(result.logs[0].args.causer, alice);
    assert(result.logs[0].args.newOwner, bob);
    assert(result.logs[0].args.date, new Date().getTime());
  });

  it('should only allow a hotel owner to change hotel ownership', async() => {
    try{
      const result = await hotelInstance.changeHotelCategory(bob, hotelId,{from:alice});
    }catch(err){
      assert(err.message.includes("You Do Not Own This Hotel Item"));
      return;
    }
    assert(false);
  });

  it('can return hotel name by hotel id', async() => {
      const hotel = await hotelInstance.hotelItemId(hotelId);
      const hotelName = await hotelInstance.getName(hotelId);
      assert.equal(hotel.name,hotelName);
  });
});
