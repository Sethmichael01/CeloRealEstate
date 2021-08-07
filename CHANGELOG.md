# Gamify ChangeLog

Change Log file for the dacade [Celo Development 101](https://dacade.org/communities/celo-development-101) dApp submission by [SethLonge](https://dacade.org/communities/celo-development-101/submissions/94bd124a-b545-4d4f-8f42-7c244e4e7abb).

**```Keywords```**

* `Added` for new features.
* `Changed` for changes in existing functionality.
* `Deprecated` for soon-to-be removed features.
* `Removed` for now removed features.
* `Fixed` for any bug fixes.
* `Security` in case of vulnerabilities.

## [emmanuelJet](https://github.com/emmanuelJet) - 2021-08-07

**Contract Review:** I optimized the contract code by updating the current structure and including new functions in a new contract file. I started by removing the `onwerAddress` variable as it does not perform any function. Then I introduced a Payment struct to assist in saving property purchase transactions (amount, buyer, seller, timestamp). The struct keeps all property purchases per property for record-keeping. I then included functions to make payment and changing of property owner seamless (propertyPayment and processProperty functions). I then introduced the method that gets property transaction details (getPropertyTrans function). Also, I included a method to make property buyers change the property price after a successful purchase (changePropertyPrice function). Lastly, I fixed the bug of changing the property `for_sale` status after and before a property purchase (changePropertyForsaleStatus function). **DApp Review:** I added a GitHub Workflow script to automatically build and deploy the dApp using GitHub Pages instead of using the *Heroku Platform* for deployment. **Design Review:** You can include the user-connected wallet and balance for analytics purposes. The UI mentioned something about earning that the contract does not illustrate. You might want to work on that more than the function I implemented to change property price. I feel a bottom margin needs to be after the call to action button on the property list. The `Add Listing` button in the navbar needs some attention as it does not include a href attribute.

### Added

* Contract with its JSON abi files
* build_and_deploy.yml file
* .editorconfig file
* CHANGELOG.md file
