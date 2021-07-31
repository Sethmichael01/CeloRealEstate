// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;


// interface
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


contract Estate {

// land struct
  struct Property {
    address payable owner;
    string land_title;
    string land_description;
    string land_picture; //picture of he land
    uint price;
    bool for_sale; //check if the land is for sale
  }


// number of games
  uint internal number_of_properties = 0;

// owner of ths contract
address payable internal onwerAddress;

// mapping of game to a unique index identifier
  mapping (uint => Property) internal properties;
  address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

  constructor() {
    //   declare the owner address
    onwerAddress = payable(msg.sender);
  }

  modifier onlyOwner(uint _id) {
        require(msg.sender == properties[_id].owner,"Only owner of the property can call this function.");
        _;
    }


// ensure the property is for sale

 modifier forsale(uint _id) {
        require(properties[_id].for_sale == true,"Only owner of the land can call this function.");
        _;
    }


// add a game to the blockchain
  function addProperty(
    string memory _title,
    string memory _description,
    string memory _picture, 
    uint _price
  ) public {
    
    properties[number_of_properties] = Property(
      payable(msg.sender),
      _title,
      _description,
      _picture,
      _price,
      false
    );
    number_of_properties++;
  }


// get a single property
  function getProperty(uint _index) public view returns (
    address payable owner,
    string memory land_title, 
    string memory land_description, 
    string memory land_picture, 
    uint price, 
    bool for_sale
  ) {
    Property storage property = properties[_index];
    return(
      property.owner,
      property.land_title,
      property.land_description,
      property.land_picture,
      property.price,
      property.for_sale
    );
  }


// function to buy a property and send cusd to the owner
  function buyProperty(uint _index) public  payable forsale(_index) {
     
    require(
      IERC20Token(cUsdTokenAddress).transferFrom(
        msg.sender,
        properties[_index].owner,
        properties[_index].price
      ),
      "Purchase of property failed."
    );


// transfer the property to the new owner
    properties[_index].owner = payable(msg.sender) ;
  }
  
  function getPropertyLength() public view returns (uint) {
    return (number_of_properties);
  }
  

      //owner of the property can set the property to be availalble for sales
    function sell(uint _id) public onlyOwner(_id){
            properties[_id].for_sale = true;

    }


}





