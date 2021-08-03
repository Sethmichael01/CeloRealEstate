import React, { useEffect, useState } from "react";

// import celo kit
import { newKitFromWeb3 } from "@celo/contractkit";
import Web3 from "@celo/contractkit/node_modules/web3";
import BigNumber from "bignumber.js";

// import ABIS
import Estate from "./abis/Estate.abi.json";
import erc20Abi from "./abis/erc20.abi.json";

// import loader library
import AWN from "awesome-notifications";

// import css
import "@celo-tools/use-contractkit/lib/styles.css";

// addresses
const celo_address = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
const real_estate_address = "0xe3A3F5dBA7b45FDe3572363e0fD62bDc2374C652";

// initialize library
const notifier = new AWN();

const App = () => {
  const [cUSDBalance, setcUSDBalance] = useState(0);
  const [contract, setcontract] = useState(null);
  const [address, setAddress] = useState(null);
  const [kit, setKit] = useState(null);
  const [myProperties, setMyProperties] = useState([]);
  const [allProperties, setallProperties] = useState([]);
  const [availableProperties, setavailableProperties] = useState([]);
  const [notAvailableProperties, setnotAvailableProperties] = useState([]);

  // property form
  const [property_title, set_property_title] = useState("");
  const [property_image, set_property_image] = useState("");
  const [property_price, set_property_price] = useState(null);
  const [property_description, set_property_description] = useState("");

  const ERC20_DECIMALS = 18;

  // show all the available properties
  const [show_available, setshow_available] = useState(false);
  //  show availables that are not available
  const [show_not_available, setshow_not_available] = useState(false);
  // show my properties
  const [show_mine, setshow_mine] = useState(false);
  // show all properties
  const [show_all, setshow_all] = useState(true);

  useEffect(() => {
    // connect the users wallet

    connectCeloWallet();
  }, []);

  const connectCeloWallet = async () => {
    if (window.celo) {
      // notification("⚠️ Please approve this DApp to use it.")

      try {
        await window.celo.enable();
        // notificationOff()
        const web3 = new Web3(window.celo);
        let kit = newKitFromWeb3(web3);

        const accounts = await kit.web3.eth.getAccounts();
        const user_address = accounts[0];

        kit.defaultAccount = user_address;

        await setAddress(user_address);

        await setKit(kit);
        return true;
      } catch (error) {
        console.log({ error });
        // notification(`⚠️ ${error}.`)
      }
    } else {
      notifier.alert(
        "You need to install the CeloExtensionWallet to use this dapp "
      );
      // notification("⚠️ Please install the CeloExtensionWallet.")
    }
  };

  useEffect(() => {
    if (kit && address) {
      return getBalance();
    } else {
      console.log("no kit or address");
    }
  }, [kit, address]);

  const getBalance = async () => {
    const balance = await kit.getTotalBalance(address);
    const USDBalance = balance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2);

    const contract = new kit.web3.eth.Contract(Estate, real_estate_address);

    setcontract(contract);
    setcUSDBalance(USDBalance);
  };

  const getProperties = async () => {
    const _propertyLength = await contract.methods.getPropertyLength().call();
    const _properties = [];

    for (let i = 0; i < _propertyLength; i++) {
      let _b = new Promise(async (resolve, reject) => {
        let _property = await contract.methods.getProperty(i).call();

        resolve({
          index: i,
          owner: _property[0],
          property_title: _property[1],
          property_description: _property[2],
          property_picture: _property[3],
          price: new BigNumber(_property[4]),
          for_sale: _property[5],
          // price: new BigNumber(candidate[5]),
          // sold: candidate[6],
        });
      });
      _properties.push(_b);
    }
    const all_properties = await Promise.all(_properties);

    const my_properties = all_properties.filter((a) => {
      return a.owner === address;
    });

    const available_properties = all_properties.filter((a) => {
      return a.for_sale === true;
    });

    const not_available_properties = all_properties.filter((a) => {
      return a.for_sale === false;
    });

    setMyProperties(my_properties);
    setavailableProperties(available_properties);
    setallProperties(all_properties);
    setnotAvailableProperties(not_available_properties);
    return true;
  };

  const _contract_buy_property = async (_price, _index) => {
    const cUSDContract = new kit.web3.eth.Contract(erc20Abi, celo_address);

    const cost = new BigNumber(_price).shiftedBy(ERC20_DECIMALS).toString();

    try {
      await cUSDContract.methods
        .approve(real_estate_address, cost)
        .send({ from: address });

      await contract.methods.buyProperty(_index).send({ from: address });
      // return result
      await getBalance();
      await getProperties();
      return true;
    } catch (error) {
      throw error;
    }
  };

  const buyProperty = async (_price, _index) => {
    try {
      notifier.asyncBlock(
        _contract_buy_property(_price, _index),
        "Property has been purchased successfully!!!",
        "Failed to purchase property",
        "Purchasing your dream property"
      );
    } catch (error) {
      console.log({ error });
    }
  };

  const _contract_add_property = async () => {
    try {
      await contract.methods
        .addProperty(
          property_title,
          property_description,
          property_image,
          property_price
        )
        .send({ from: address });
      await getProperties();
      return true;
    } catch (error) {
      throw error;
    }
  };

  const addProperty = async (e) => {
    e.preventDefault();
    try {
      if (
        !property_image ||
        !property_title ||
        !property_description ||
        !property_price
      ) {
        return alert("Please enter all fields");
      }

      if (
        property_image.length < 1 ||
        property_title.length < 1 ||
        property_description.length < 1
      ) {
        return alert("Please enter all fields");
      }
      const cUSDContract = new kit.web3.eth.Contract(erc20Abi, celo_address);
      const price = new BigNumber(property_price)
        .shiftedBy(ERC20_DECIMALS)
        .toString();
      notifier.asyncBlock(
        _contract_add_property(),
        "Property has been added successfully...",
        "Adding property failed",
        "Adding Property to the Blockchain..."
      );
    } catch (error) {
      console.log({ error });
    }
  };

  const openSales = async (index) => {
    try {
      console.log({ index });

      await contract.methods.sell(index).send({ from: address });

      getProperties();
    } catch (error) {
      console.log({ error });
      alert("Something went wrong");
    }
  };

  const listing = () => {
    if (show_all) {
      return allProperties.map((property, key) => (
        <li className="near-by-you design card-container col-lg-3 col-md-6 col-sm-6">
          <div className="listing-bx featured-star-right m-b30 style-2">
            <div className="listing-media">
              <img src={property.property_picture} alt="" />

              <ul className="featured-star">
                <li>
                  <i className="fa fa-star" />
                </li>
                <li>
                  <i className="fa fa-star" />
                </li>
                <li>
                  <i className="fa fa-star" />
                </li>
                <li>
                  <i className="fa fa-star" />
                </li>
                <li>
                  <i className="fa fa-star" />
                </li>
              </ul>
            </div>
            <div className="listing-info">
              <h3 className="title">
                <a>{property.property_title}</a>
              </h3>
              <p>{property.property_description}</p>
              <ul className="place-info">
                <li className="place-location">
                  {property.owner === address ? (
                    property.for_sale ? (
                      <a
                        style={{ color: "white" }}
                        className="site-button radius-xl m-l10"
                      >
                        Close Sales
                      </a>
                    ) : (
                      <a
                        onClick={(e) => {
                          openSales(property.index);
                        }}
                        style={{ color: "white" }}
                        className="site-button radius-xl m-l10"
                      >
                        Open Sales
                      </a>
                    )
                  ) : (
                    <a
                      style={{ color: "white" }}
                      className="site-button radius-xl m-l10"
                      onClick={() => {
                        buyProperty(property.price, property.index);
                      }}
                    >
                      Purchase
                    </a>
                  )}
                </li>
                <li className="open">
                  {property.for_sale ? (
                    <>
                      <i className="fa fa-check" />
                      For Sale
                    </>
                  ) : (
                    <>
                      <i className="fa fa-check" />
                      Closed
                    </>
                  )}
                </li>
              </ul>
              <ul className="place-info">
                <center>
                  <h3>{property.price.toString()} cUsd</h3>
                </center>
              </ul>
            </div>
          </div>
        </li>
      ));
    }

    if (show_mine) {
      return myProperties.map((property, key) => (
        <li className="near-by-you design card-container col-lg-3 col-md-6 col-sm-6">
          <div className="listing-bx featured-star-right m-b30 style-2">
            <div className="listing-media">
              <img src={property.property_picture} alt="" />

              <ul className="featured-star">
                <li>
                  <i className="fa fa-star" />
                </li>
                <li>
                  <i className="fa fa-star" />
                </li>
                <li>
                  <i className="fa fa-star" />
                </li>
                <li>
                  <i className="fa fa-star" />
                </li>
                <li>
                  <i className="fa fa-star" />
                </li>
              </ul>
            </div>
            <div className="listing-info">
              <h3 className="title">
                <a>{property.property_title}</a>
              </h3>
              <p>{property.property_description}</p>
              <ul className="place-info">
                <li className="place-location">
                  {property.owner === address ? (
                    property.for_sale ? (
                      <a
                        style={{ color: "white" }}
                        className="site-button radius-xl m-l10"
                      >
                        Close Sales
                      </a>
                    ) : (
                      <a
                        onClick={(e) => {
                          openSales(property.index);
                        }}
                        style={{ color: "white" }}
                        className="site-button radius-xl m-l10"
                      >
                        Open Sales
                      </a>
                    )
                  ) : (
                    <a
                      style={{ color: "white" }}
                      className="site-button radius-xl m-l10"
                      onClick={() => {
                        buyProperty(property.price, property.index);
                      }}
                    >
                      Purchase
                    </a>
                  )}
                </li>
                <li className="open">
                  {property.for_sale ? (
                    <>
                      <i className="fa fa-check" />
                      For Sale
                    </>
                  ) : (
                    <>
                      <i className="fa fa-check" />
                      Closed
                    </>
                  )}
                </li>
              </ul>
              <ul className="place-info">
                <center>
                  <h3>{property.price.toString()} cUsd</h3>
                </center>
              </ul>
            </div>
          </div>
        </li>
      ));
    }

    if (show_available) {
      return availableProperties.map((property, key) => (
        <li className="near-by-you design card-container col-lg-3 col-md-6 col-sm-6">
          <div className="listing-bx featured-star-right m-b30 style-2">
            <div className="listing-media">
              <img src={property.property_picture} alt="" />

              <ul className="featured-star">
                <li>
                  <i className="fa fa-star" />
                </li>
                <li>
                  <i className="fa fa-star" />
                </li>
                <li>
                  <i className="fa fa-star" />
                </li>
                <li>
                  <i className="fa fa-star" />
                </li>
                <li>
                  <i className="fa fa-star" />
                </li>
              </ul>
            </div>
            <div className="listing-info">
              <h3 className="title">
                <a>{property.property_title}</a>
              </h3>
              <p>{property.property_description}</p>
              <ul className="place-info">
                <li className="place-location">
                  {property.owner === address ? (
                    property.for_sale ? (
                      <a
                        style={{ color: "white" }}
                        className="site-button radius-xl m-l10"
                      >
                        Close Sales
                      </a>
                    ) : (
                      <a
                        onClick={(e) => {
                          openSales(property.index);
                        }}
                        style={{ color: "white" }}
                        className="site-button radius-xl m-l10"
                      >
                        Open Sales
                      </a>
                    )
                  ) : (
                    <a
                      style={{ color: "white" }}
                      className="site-button radius-xl m-l10"
                      onClick={() => {
                        buyProperty(property.price, property.index);
                      }}
                    >
                      Purchase
                    </a>
                  )}
                </li>
                <li className="open">
                  {property.for_sale ? (
                    <>
                      <i className="fa fa-check" />
                      For Sale
                    </>
                  ) : (
                    <>
                      <i className="fa fa-check" />
                      Closed
                    </>
                  )}
                </li>
              </ul>
              <ul className="place-info">
                <center>
                  <h3>{property.price.toString()} cUsd</h3>
                </center>
              </ul>
            </div>
          </div>
        </li>
      ));
    }

    if (show_not_available) {
      return notAvailableProperties.map((property, key) => (
        <li className="near-by-you design card-container col-lg-3 col-md-6 col-sm-6">
          <div className="listing-bx featured-star-right m-b30 style-2">
            <div className="listing-media">
              <img src={property.property_picture} alt="" />

              <ul className="featured-star">
                <li>
                  <i className="fa fa-star" />
                </li>
                <li>
                  <i className="fa fa-star" />
                </li>
                <li>
                  <i className="fa fa-star" />
                </li>
                <li>
                  <i className="fa fa-star" />
                </li>
                <li>
                  <i className="fa fa-star" />
                </li>
              </ul>
            </div>
            <div className="listing-info">
              <h3 className="title">
                <a>{property.property_title}</a>
              </h3>
              <p>{property.property_description}</p>
              <ul className="place-info">
                <li className="place-location">
                  {property.owner === address ? (
                    property.for_sale ? (
                      <a
                        style={{ color: "white" }}
                        className="site-button radius-xl m-l10"
                      >
                        Close Sales
                      </a>
                    ) : (
                      <a
                        onClick={(e) => {
                          openSales(property.index);
                        }}
                        style={{ color: "white" }}
                        className="site-button radius-xl m-l10"
                      >
                        Open Sales
                      </a>
                    )
                  ) : (
                    <a
                      style={{ color: "white" }}
                      className="site-button radius-xl m-l10"
                      onClick={() => {
                        buyProperty(property.price, property.index);
                      }}
                    >
                      Purchase
                    </a>
                  )}
                </li>
                <li className="open">
                  {property.for_sale ? (
                    <>
                      <i className="fa fa-check" />
                      For Sale
                    </>
                  ) : (
                    <>
                      <i className="fa fa-check" />
                      Closed
                    </>
                  )}
                </li>
              </ul>
              <ul className="place-info">
                <center>
                  <h3>{property.price.toString()} cUsd</h3>
                </center>
              </ul>
            </div>
          </div>
        </li>
      ));
    }

    return null;
  };

  useEffect(() => {
    if (contract) {
      notifier.asyncBlock(
        getProperties(),
        "Fetched properties",
        "Failed to fetch properties",
        "Fetching properties from the blockchain"
      );
    }
  }, [contract]);

  return (
    <div className="page-wraper font-roboto">
      {/* header */}
      <header className="site-header header-transparent mo-left header-style3">
        {/* main header */}
        <div className="sticky-header main-bar-wraper navbar-expand-lg">
          <div className="main-bar clearfix onepage">
            <div className="container clearfix">
              {/* website logo */}
              <div className="logo-header mostion">
                <h1> Estate</h1>
              </div>
              {/* nav toggle button */}
              <button
                className="navbar-toggler collapsed navicon justify-content-end"
                type="button"
                data-toggle="collapse"
                data-target="#navbarNavDropdown"
                aria-controls="navbarNavDropdown"
                aria-expanded="false"
                aria-label="Toggle navigation"
              >
                <span />
                <span />
                <span />
              </button>
              {/* extra nav */}
              <div className="extra-nav">
                <div className="extra-cell">
                  <a
                    style={{ color: "white" }}
                    href="#AddProperty"
                    className="site-button radius-xl m-l10"
                  >
                    <i className="fa fa-plus m-r5" /> Add Listing
                  </a>
                </div>
              </div>
              {/* main nav */}
            </div>
          </div>
        </div>
        {/* main header END */}
      </header>
      {/* header END */}
      {/* Content */}
      <div className="page-content bg-white">
        {/* Section Banner */}
        <div
          className="dlab-bnr-inr dlab-bnr-inr-md bnr-style1"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=750&q=80)",
            backgroundSize: "cover",
          }}
          id="dezParticles"
        >
          <div className="container">
            <div className="dlab-bnr-inr-entry align-m dlab-home">
              <div className="bnr-content">
                <h2>Explore Real Estate</h2>
              </div>
              <div className="navbar scroll-button">
                <a
                  href="#page_content"
                  className="site-button button-style1 scroll"
                >
                  <i className="la la-long-arrow-down" />
                </a>
              </div>
            </div>
          </div>
        </div>
        {/* Section Banner END */}
        <div className="content-block" id="page_content">
          {/* Featured Destinations */}

          {/* Featured Destinations End */}
          {/* Our Services */}
          <div className="section-full bg-gray-1 content-inner about-us">
            <div className="container-fluid">
              <div className="section-head text-black text-left text-center">
                <h2 className="box-title">
                  Explore Properties on the Blockchain
                </h2>
                <p>Get access to quality real estate around the world.</p>
                <h4>cUSD balance : {cUSDBalance}</h4>
                <div className="dlab-separator bg-primary" />
              </div>
              <div className="site-filters clearfix center m-b40 listing-filters">
                <ul className="filters" data-toggle="buttons">
                  <li
                    data-filter
                    className="btn active"
                    onClick={() => {
                      setshow_all(true);
                      setshow_mine(false);
                      setshow_not_available(false);
                      setshow_available(false);
                    }}
                  >
                    <input type="radio" />
                    <a href="javascript:void(0);" className="site-button-link">
                      <span>
                        <i className />
                        All
                      </span>
                    </a>
                  </li>
                  <li
                    data-filter="latest-listings"
                    className="btn"
                    onClick={() => {
                      setshow_all(false);
                      setshow_mine(true);
                      setshow_not_available(false);
                      setshow_available(false);
                    }}
                  >
                    <input type="radio" />
                    <a href="javascript:void(0);" className="site-button-link">
                      <span>
                        <i className="la la-thumb-tack" />
                        My Properties
                      </span>
                    </a>
                  </li>
                  <li
                    data-filter="popular-ratings"
                    className="btn"
                    onClick={() => {
                      setshow_all(false);
                      setshow_mine(false);
                      setshow_not_available(false);
                      setshow_available(true);
                    }}
                  >
                    <input type="radio" />
                    <a href="javascript:void(0);" className="site-button-link">
                      <span>
                        <i className="la la-star-o" /> For Sale
                      </span>
                    </a>
                  </li>
                  <li
                    data-filter="near-by-you"
                    className="btn"
                    onClick={() => {
                      setshow_all(false);
                      setshow_mine(false);
                      setshow_not_available(true);
                      setshow_available(false);
                    }}
                  >
                    <input type="radio" />
                    <a href="javascript:void(0);" className="site-button-link">
                      <span>
                        <i className="la la-heart-o" /> Not For Sale
                      </span>
                    </a>
                  </li>
                </ul>
              </div>
              <div className="clearfix">
                <ul
                  id="masonry"
                  className="dlab-gallery-listing gallery-grid-4 gallery row"
                >
                  {listing()}
                </ul>
              </div>
            </div>
          </div>
          {/* Our Services */}
          {/* Why Choose Us */}
          <div className="section-full bg-img-fix bg-white content-inner">
            <div className="container">
              <div className="section-head text-center">
                <h2 className="box-title">How It Works?</h2>
                <div className="dlab-separator bg-primary" />
                <p>
                  Celo real estate connects you to thousands of real estate
                  properties on the blockchain easily all over the world
                </p>
              </div>
              <div className="row">
                <div className="col-lg-4 col-md-6">
                  <div className="icon-bx-wraper center work-box style1 m-b30">
                    <div className="box-count">01</div>
                    <div className="icon-bx-lg radius bg-gray-1 m-b20">
                      <a href="javascript:void(0)" className="icon-cell">
                        <i className="ti-search text-primary" />
                      </a>
                    </div>
                    <div className="icon-content">
                      <h3 className="dlab-tilte">Choose What To Do?</h3>
                      <p>
                        Choose if you want to buy or sell on celo real estate.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-lg-4 col-md-6">
                  <div className="icon-bx-wraper center work-box style1 m-b30">
                    <div className="box-count">02</div>
                    <div className="icon-bx-lg radius bg-gray-1 m-b20">
                      <a href="javascript:void(0)" className="icon-cell">
                        <i className="ti-gift text-primary" />
                      </a>
                    </div>
                    <div className="icon-content">
                      <h3 className="dlab-tilte">Find What Your Want?</h3>
                      <p>Choose the property you want to buy or sell.</p>
                    </div>
                  </div>
                </div>
                <div className="col-lg-4 col-md-6">
                  <div className="icon-bx-wraper center work-box style1 m-b30">
                    <div className="box-count">03</div>
                    <div className="icon-bx-lg radius bg-gray-1 m-b20">
                      <a href="javascript:void(0)" className="icon-cell">
                        <i className="ti-rocket text-primary" />
                      </a>
                    </div>
                    <div className="icon-content">
                      <h3 className="dlab-tilte">Earn</h3>
                      <p>
                        Sell the property and gain cusd or buy quality
                        properties around the world.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Why Chose Us End */}

          {/* add property starts */}

          <div
            id="AddProperty"
            className="section-full bg-img-fix bg-white content-inner"
          >
            <div className="container">
              <div className="section-head text-center">
                <h2 className="box-title">Add Property</h2>
                <div className="dlab-separator bg-primary" />
                <p>Add a property to the Celo Blockchain</p>
              </div>

              <form
                className="add-listing-form"
                onSubmit={(e) => {
                  addProperty(e);
                }}
              >
                <div className="content-box">
                  <div className="content-body">
                    <div className="form-group">
                      <label>Property Name</label>
                      <input
                        required
                        type="text"
                        className="form-control m-b10"
                        placeholder="Name of property"
                        onChange={(e) => {
                          set_property_title(e.target.value);
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Property Description</label>
                      <input
                        required
                        type="text"
                        className="form-control m-b10"
                        placeholder="enter description..."
                        onChange={(e) => {
                          set_property_description(e.target.value);
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Property Image</label>
                      <input
                        required
                        type="url"
                        className="form-control m-b10"
                        placeholder="www.pexels.com"
                        onChange={(e) => {
                          set_property_image(e.target.value);
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Property Price</label>
                      <input
                        required
                        type="number"
                        className="form-control m-b10"
                        onChange={(e) => {
                          set_property_price(e.target.value);
                        }}
                        // placeholder="Staple & Fancy Hotel"
                      />
                    </div>

                    <div className="form-group">
                      <button
                        type="submit"
                        className="site-button radius-xl m-l10"
                      >
                        <i className="fa fa-plus m-r5" /> Add Property
                      </button>{" "}
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* contact area END */}
      </div>
      {/* Content END*/}
      {/* Footer */}
      <footer className="site-footer bg-black-2">
        <div className="footer-top">
          <div className="container saf-footer">
            <div className="row">
              <div className="col-md-6 col-lg-3 col-sm-6 footer-col-4">
                <div className="widget widget_getintuch">
                  <h5 className="m-b30 text-white text-uppercase ">
                    Contact us
                  </h5>
                  <ul>
                    <li>
                      <i className="ti-location-pin" />
                      <strong>address</strong>Dacade headquarters
                    </li>
                    <li>
                      <i className="ti-mobile" />
                      <strong>phone</strong>Dacade Line (24/7 Support Line)
                    </li>
                    <li>
                      <i className="ti-email" />
                      <strong>email</strong>info@dacade.com
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-md-6 col-lg-3 col-sm-6 col-5 footer-col-4">
                <div className="widget widget_services border-0">
                  <h5 className="m-b30 text-white text-uppercase ">Celo</h5>
                  <ul>
                    <li>
                      <a href="/">Home</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* footer bottom part */}
        <div className="footer-bottom">
          <div className="container">
            <div className="row">
              <div className="col-md-6 col-sm-12 text-left">
                {" "}
                <span>© 2021 Real Estate</span>{" "}
              </div>
              <div className="col-md-6 col-sm-12 text-right">
                <div className="widget-link "></div>
              </div>
            </div>
          </div>
        </div>
      </footer>
      {/* Footer END */}
      <button className="scroltop fa fa-chevron-up" />
    </div>
  );
};

export default App;
