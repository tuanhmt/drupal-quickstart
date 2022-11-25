import React from 'react'
import PropTypes from 'prop-types'

class SearchBox extends React.Component {
  static propTypes = {
    searchField: PropTypes.string.isRequired,
    onChangeCallback: PropTypes.func
  }

  handleChange = (e) => {
    this.props.onChangeCallback(e)
  };

  render() {
    return (
      <div className="input-group input-group-sm">
        <input onChange = {this.handleChange} type="text" name="table_search" className="form-control float-right" placeholder="Search" />
        <div className="input-group-append">
          <button type="submit" className="btn btn-default">
            <i className="fas fa-search"></i>
          </button>
        </div>
      </div>
    )
  }
}

export default SearchBox