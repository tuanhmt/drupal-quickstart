import React from 'react'
import PropTypes from 'prop-types'
import './ArticleTable.css'
import api from '../../utils/api.js'
import BarLoader from 'react-spinners/BarLoader'
import ReactPaginate from 'react-paginate'
import SearchBox from '../SearchBox/SearchBox'

class ArticleTable extends React.Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {
      articles: [],
      hasError: false,
      isLoading: true,
      sortBy: 'nid',
      order: 'asc',
      offset: 0,
      perPage: 10,
      currentPage: 0,
    }

    this.handlePageClick = this
        .handlePageClick
        .bind(this)
  }

  /**
   * Returns the JSON API endpoint
   * with optional params like filter, sort, ...
   *
   * @param params
   * @returns {string}
   */
  static getArticlesEndpoint(params = '') {
    return `${api.getApiBaseUrl()}/api/json/article${params}`
  }

  /**
   * Returns the JSON API endpoint params
   * with optional params like filter, sort, ...
   * @returns {string}
   */
  getParams() {
    let sortParam = '?sort=' + ((this.state.order === 'asc') ? this.state.sortBy : ('-' + this.state.sortBy))
    let offset = this.state.currentPage * this.state.perPage
    let paginationParam = '&page[limit]=' + this.state.perPage + '&page[offset]=' + offset
    return sortParam + paginationParam
  }

  /**
   * Returns the entity id passed to the react container as a data attribute.
   *
   * @returns {number}
   */
  static getCurrentEntityId() {
    return document.getElementById(api.getAppContainerId()).getAttribute('data-entity-id')
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  componentDidMount() {
    const sortParam = '?sort=' + (this.state.sortBy ? this.state.sortBy : 'id') + 
    '&page[limit]=' + this.state.perPage
    const articlesEndpoint = ArticleTable.getArticlesEndpoint(sortParam)
    this.fetchArticles(articlesEndpoint)
  }

  sortClasses(sortBy) {
    let classes = 'sorting'
    if (this.state.sortBy === sortBy) {
      if (this.state.order === 'asc') {
        classes += ' sorting_asc'
      } else {
        classes += ' sorting_desc'
      }
    }
    return classes
  }

  sortHandler = (sortBy, order) => {
    let sortParam = '?sort=' + ((order === 'asc') ? sortBy : ('-' + sortBy))
    let articlesEndpoint = ArticleTable.getArticlesEndpoint(sortParam)
    this.setState({
      isLoading: true,
      sortBy: sortBy,
      order: order,
    }, () => this.fetchArticles(articlesEndpoint))
  }

  // paginationHandler = (articlesEndpoint) => {
  //   this.setState({
  //     isLoading: true,
  //   }, () => this.fetchArticles(articlesEndpoint))
  // }

  onClickSort = (entry, order) => (e) => {
    e.preventDefault()
    entry.callback(entry.sortBy, order)
  }

  // onClickPagination = (entry) => (e) => {
  //   e.preventDefault()
  //   entry.callback(entry.href)
  // }

  handlePageClick = (e) => {
    const selectedPage = e.selected
    const offset = selectedPage * this.state.perPage
    this.setState({
      currentPage: selectedPage,
      offset: offset
    }, () => {
        let articlesEndpoint = ArticleTable.getArticlesEndpoint(this.getParams())
        this.fetchArticles(articlesEndpoint)
    })
  }

  handleSearch= (e) => {
    alert(e.target.value)
  }

  /**
   * Fetches articles data.
   *
   * @param endpoint
   */
  fetchArticles(endpoint) {
    this.setState({ isLoading: true })
    fetch(endpoint)
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText)
        }
        return response
      })
      .then(response => response.json())
      // ES6 property value shorthand for { articles: articles }
      // and optionally use the second parameter as a callback.
      .then(articles => {
        // this.setState({ articles }, this.setArticlesWithIncludedUrl)
        this.setState({ 
          articles,
          isLoading: false,
          pageCount: Math.ceil(articles.meta.count / this.state.perPage)
        })
      })
      .catch(() => this.setState({ hasError: true }))
  }

  render() {
    const { title } = this.props

    if (this.state.order) {
      if (this.state.hasError) {
        return <p>Error while loading articles.</p>
      }
    }

    if (this.state.isLoading) {
      return <BarLoader
        color="#36d7b7"
        loading={true}
        cssOverride={
          React.CSSProperties = {
            display: 'block',
            margin: '0 auto'
          }
        }
        size={150}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
    }

    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{title}</h3>
          <div className="card-tools">
            <SearchBox
              searchField={"title"}
              onChangeCallback={this.handleSearch}
            />
          </div>
        </div>

        <div className="card-body table-responsive">
          <table className="table dataTable table-striped table-head-fixed dtr-inline text-nowrap table-bordered">
            <thead>
              <tr>
                <th className={this.sortClasses('nid')} onClick={
                  this.onClickSort({ callback: this.sortHandler, sortBy: 'nid' },
                    (this.state.order === 'asc') ? 'desc' : 'asc')}>#</th>
                <th className={this.sortClasses('title')} onClick={
                  this.onClickSort({ callback: this.sortHandler, sortBy: 'title' },
                    (this.state.order === 'asc') ? 'desc' : 'asc')}>Title</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {this.state.articles.data.map(article => (
                <tr key={article.id}>
                  <td>{article.attributes.drupal_internal__nid}</td>
                  <td>{article.attributes.title}</td>
                  <td>{article.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card-footer clearfix">
          <div class="footer-wrapper row">
            <div class="col-sm-6" role="status" aria-live="polite">
              Showing {this.state.offset + 1} to {this.state.offset + this.state.perPage} of {this.state.articles.meta.count} entries
            </div>
            <div class="col-sm-6">
              <ReactPaginate
                previousLabel={"Prev"}
                nextLabel={"Next"}
                breakLabel={"..."}
                pageCount={this.state.pageCount}
                marginPagesDisplayed={2}
                pageRangeDisplayed={5}
                onPageChange={this.handlePageClick}
                containerClassName={"pagination m-0 float-right"}
                activeClassName={"active"}
                pageClassName={"page-item"}
                pageLinkClassName={"page-link"}
                previousLinkClassName={"page-link"}
                nextLinkClassName={"page-link"}
                disabledClassName={"page-item disabled"}
                breakClassName={"page-item"}
                breakLinkClassName={"page-link"}
                forcePage={this.state.currentPage}
              />
            </div>
          </div>

          {/* <ul className="pagination pagination-sm m-0 float-right">
            {
              Object.keys(this.state.articles.links).map((key) => (
                key !== "self" ?
                  <li key={key} className="page-item">
                    <a className="page-link" onClick={
                      this.onClickPagination({ callback: this.paginationHandler, href: this.state.articles.links[key].href })}>
                      {this.capitalize(key)}
                    </a>
                  </li>
                  : null
              ))
            }
          </ul> */}
        </div>
      </div>
    )
  }
}

export default ArticleTable