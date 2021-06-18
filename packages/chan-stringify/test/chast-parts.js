
export const PREFACE = {
  type: 'preface',
  children: [
    {
      type: 'heading',
      depth: 1,
      children: [ { type: 'text', value: 'Changelog' } ]
    },
    {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: 'All notable changes to this project will be documented in this file.'
        }
      ]
    },
    {
      type: 'paragraph',
      children: [
        { type: 'text', value: 'The format is based on ' },
        {
          type: 'link',
          title: null,
          url: 'https://keepachangelog.com/en/1.0.0/',
          children: [ { type: 'text', value: 'Keep a Changelog' } ]
        },
        { type: 'text', value: ',\nand this project adheres to ' },
        {
          type: 'link',
          title: null,
          url: 'https://semver.org/spec/v2.0.0.html',
          children: [ { type: 'text', value: 'Semantic Versioning' } ]
        },
        { type: 'text', value: '.' }
      ]
    }
  ]
}

