# Endsmart

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/Stripe.endsmart)](https://marketplace.visualstudio.com/items?itemName=Stripe.endsmart)

A replacement for the [endwise extension](https://marketplace.visualstudio.com/items?itemName=kaiwood.endwise) with the same objective: be able to intelligently add `end` statements when needed to Ruby blocks.

Compared to endwise, this extension tries to use more modern VSCode APIs rather than low-level command processing. The end result remains roughly the same but with better performance characteristics and generally behaving better in [remote development scenarios](https://code.visualstudio.com/docs/remote/remote-overview) by reducing typing latency.

## Usage

Once installed [from the marketplace](https://marketplace.visualstudio.com/items?itemName=Stripe.endsmart), you will need to enable on-type formatting (globally or specifically for Ruby) for the extension to work properly (as it is implemented as a formatter).

Here is an example user configuration:

```json
"[ruby]": {
  "editor.formatOnType": true
},
```

## Contributing

This extension is voluntarily kept fairly simple and focused on doing its core job well. As a result we do not expect a tremendous amount of extra changes to be needed.

However contributions and feedback to this extension are still welcome, so please open issues for feature requests, questions and alike.

## License

See [LICENSE](LICENSE)

## Code of Conduct

This project has adopted the Stripe Code of Conduct. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
