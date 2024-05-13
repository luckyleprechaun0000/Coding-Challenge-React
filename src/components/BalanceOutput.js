import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as utils from '../utils';

class BalanceOutput extends Component {
  render() {
    if (!this.props.userInput.format) {
      return null;
    }

    return (
      <div className='output'>
        <p>
          Total Debit: {this.props.totalDebit} Total Credit: {this.props.totalCredit}
          <br />
          Balance from account {this.props.userInput.startAccount || '*'}
          {' '}
          to {this.props.userInput.endAccount || '*'}
          {' '}
          from period {utils.dateToString(this.props.userInput.startPeriod)}
          {' '}
          to {utils.dateToString(this.props.userInput.endPeriod)}
        </p>
        {this.props.userInput.format === 'CSV' ? (
          <pre>{utils.toCSV(this.props.balance)}</pre>
        ) : null}
        {this.props.userInput.format === 'HTML' ? (
          <table className="table">
            <thead>
              <tr>
                <th>ACCOUNT</th>
                <th>DESCRIPTION</th>
                <th>DEBIT</th>
                <th>CREDIT</th>
                <th>BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {this.props.balance.map((entry, i) => (
                <tr key={i}>
                  <th scope="row">{entry.ACCOUNT}</th>
                  <td>{entry.DESCRIPTION}</td>
                  <td>{entry.DEBIT}</td>
                  <td>{entry.CREDIT}</td>
                  <td>{entry.BALANCE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    );
  }
}

BalanceOutput.propTypes = {
  balance: PropTypes.arrayOf(
    PropTypes.shape({
      ACCOUNT: PropTypes.number.isRequired,
      DESCRIPTION: PropTypes.string.isRequired,
      DEBIT: PropTypes.number.isRequired,
      CREDIT: PropTypes.number.isRequired,
      BALANCE: PropTypes.number.isRequired
    })
  ).isRequired,
  totalCredit: PropTypes.number.isRequired,
  totalDebit: PropTypes.number.isRequired,
  userInput: PropTypes.shape({
    startAccount: PropTypes.number,
    endAccount: PropTypes.number,
    startPeriod: PropTypes.date,
    endPeriod: PropTypes.date,
    format: PropTypes.string
  }).isRequired
};

const mapStateToProps = (state) => {

  /* YOUR CODE GOES HERE */
  const userInput = state.userInput;
  const accounts = state.accounts;
  const journalEntries =  state.journalEntries;
  
  const filteredAccounts = accounts.filter(acc => 
    (!isNaN(userInput.startAccount) ? acc.ACCOUNT >= userInput.startAccount : acc.ACCOUNT >= accounts[0].ACCOUNT) && 
    (!isNaN(userInput.endAccount) ? acc.ACCOUNT <= userInput.endAccount : acc.ACCOUNT <= accounts[(accounts.length - 1)].ACCOUNT)
  );
  const filterDatesBetween = (journalEntries, startPeriod, endPeriod) => {
    // Check undefinded
    if(!startPeriod || !endPeriod) {
      return journalEntries; 
    }
    // Check if both startPeriod and endPeriod are of type Date
    else if (!isNaN(startPeriod.getTime()) && !isNaN(endPeriod.getTime())) {
        return journalEntries.filter(entry => entry.PERIOD >= startPeriod && entry.PERIOD <= endPeriod);
    }
    // If only startPeriod is not of type Date
    else if (isNaN(startPeriod.getTime()) && !isNaN(endPeriod.getTime())) {
        return journalEntries.filter(entry => entry.PERIOD <= endPeriod);
    }
    // If only endPeriod is not of type Date
    else if (!isNaN(startPeriod.getTime()) && isNaN(endPeriod.getTime()) ) {
        return journalEntries.filter(entry => entry.PERIOD >= startPeriod);
    }
    // If neither startPeriod nor endPeriod is of type Date
    else {
        return journalEntries;
    }
  }
  const filteredJournalEntries = filterDatesBetween(journalEntries, userInput.startPeriod, userInput.endPeriod);

  // Create a map of accounts from array filteredAccounts for efficient lookup
  const accountMap = new Map(filteredAccounts.map(item => [item.ACCOUNT, item.LABEL]));

  // Accumulate DEBIT and CREDIT values and calculate balance for each account in array filteredJournalEntries
  const balance = filteredJournalEntries.reduce((accumulator, currentValue) => {
    const accountLabel = accountMap.get(currentValue.ACCOUNT);
    if (accountLabel) {
      const existingEntryIndex = accumulator.findIndex(entry => entry.ACCOUNT === currentValue.ACCOUNT);
      if (existingEntryIndex !== -1) {
        accumulator[existingEntryIndex].DEBIT += currentValue.DEBIT;
        accumulator[existingEntryIndex].CREDIT += currentValue.CREDIT;
        accumulator[existingEntryIndex].BALANCE = accumulator[existingEntryIndex].DEBIT - accumulator[existingEntryIndex].CREDIT;
      } else {
        accumulator.push({
          ACCOUNT: currentValue.ACCOUNT,
          DESCRIPTION: accountLabel,
          DEBIT: currentValue.DEBIT,
          CREDIT: currentValue.CREDIT,
          BALANCE: currentValue.DEBIT - currentValue.CREDIT
        });
      }
    }
    return accumulator;
  }, []);

  //Sort the result array based on the each account
  balance.sort((a, b) => a.ACCOUNT - b.ACCOUNT);

  const totalCredit = balance.reduce((acc, entry) => acc + entry.CREDIT, 0);
  const totalDebit = balance.reduce((acc, entry) => acc + entry.DEBIT, 0);

  return {
    balance,
    totalCredit,
    totalDebit,
    userInput: state.userInput
  };
}

export default connect(mapStateToProps)(BalanceOutput);
