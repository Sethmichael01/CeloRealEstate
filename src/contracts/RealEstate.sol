// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

// CELO Token Interface
interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract RealEstate {

  // Payment struct
  struct Payment {
    bool exist;
    uint amount;
    address buyer;
    address seller;
    uint timestamp;
  }

  // Property struct
  struct Property {
    uint price;
    bool for_sale;
    string land_title;
    string land_picture;
    string land_description;
    address payable owner;
    // Records
    uint past_owner_count;
    mapping (uint => Payment) transactions;
  }

  // number of properties
  uint internal number_of_properties = 0;

  // mapping of game to a unique index identifier
  mapping (uint => Property) internal properties;

  // CELO Token Contract Address
  address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

  // ensure the property is for the owner
  modifier onlyPropertyOwner(uint _id) {
    require(msg.sender == properties[_id].owner, "Only owner of the property can call this function.");
    _;
  }

  // ensure the property is for sale
  modifier propertyForsale(uint _id) {
    require(properties[_id].for_sale == true, "Only enable property can be sold.");
    _;
  }

  // add a property to the contract
  function addProperty(
    uint _price,
    string memory _title,
    string memory _picture, 
    string memory _description
  ) public {
    Property storage newProperty = properties[number_of_properties];

    newProperty.price = _price;
    newProperty.for_sale = false;
    newProperty.land_title = _title;
    newProperty.land_picture = _picture;
    newProperty.land_description = _description;
    newProperty.owner = payable(msg.sender);
    newProperty.past_owner_count = 0;

    number_of_properties++;
  }

  // get a single property from the contract
  function getProperty(uint _id) public view returns (
    uint price, 
    bool for_sale,
    address owner,
    string memory land_title,
    string memory land_picture,
    string memory land_description,
    uint trans_count
  ) {
    Property storage property = properties[_id];

    return(
      property.price,
      property.for_sale,
      property.owner,
      property.land_title,
      property.land_picture,
      property.land_description,
      property.past_owner_count
    );
  }

  function getPropertyTrans(
    uint _property_id,
    uint _trans_id
  ) public view returns (
    uint amount,
    address buyer,
    address seller,
    uint timestamp
  ) {
    Payment storage trans = properties[_property_id].transactions[_trans_id];
    
    require(trans.exist, "Property transaction does not exist");

    return(
      trans.amount,
      trans.buyer,
      trans.seller,
      trans.timestamp
    );
  }

  // function to buy a property and send cusd to the owner
  function buyProperty(uint _id) public payable propertyForsale(_id) {
    Property storage property = properties[_id];
    
    // Ensure property owner is not buying the property
    require(msg.sender != property.owner, "Property owner cannot purchase property");
     
    // pay for the property 
    require(propertyPayment(property), "Purchase of property failed.");

    // Change property owner
    processProperty(property);
  }

  // owner of the property can change the for sale status of the property
  function changePropertyForsaleStatus(uint _id) public onlyPropertyOwner(_id) {
    properties[_id].for_sale = ! properties[_id].for_sale;
  }

  // owner of the property can change the property price
  function changePropertyPrice(
    uint _id,
    uint _price
  ) public onlyPropertyOwner(_id) {
    require(properties[_id].past_owner_count > 0, "Initial owner can't change property price.");

    properties[_id].price = _price;
  }
  
  function getPropertyLength() public view returns (uint) {
    return (number_of_properties);
  }

  // Paying for a Property
  function propertyPayment(Property storage _property) internal returns (bool) {
    bool _isValid = IERC20Token(cUsdTokenAddress).transferFrom(
      msg.sender,
      _property.owner,
      _property.price
    );

    return (_isValid);
  }

  // Add transaction record and update property owner
  function processProperty(Property storage _property) internal {
    // [Add] Record Payment Transaction
    _property.transactions[_property.past_owner_count] = Payment(
      true,
      _property.price,
      msg.sender,
      _property.owner,
      block.timestamp
    );
    // [Add] increase past owner count
    _property.past_owner_count++;


    // [Update] Change the forsale status to false
    _property.for_sale = false;
    // [Update] transfer the property to the new owner
    _property.owner = payable(msg.sender);
  }
}