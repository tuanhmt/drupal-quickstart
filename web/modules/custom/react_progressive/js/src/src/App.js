import React, { Component } from 'react';
import './App.css';
import ArticleTable from './components/ArticleTable/ArticleTable';

class App extends Component {
  render() {
      return (
        <ArticleTable title="Articles" />
      );
  }
}
export default App;
