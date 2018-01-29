/* Copyright 2017 Intel Corporation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
------------------------------------------------------------------------------*/

#include <ctype.h>
#include <string.h>

#include <iostream>
#include <string>
#include <sstream>

#include <log4cxx/logger.h>
#include <log4cxx/basicconfigurator.h>
#include <log4cxx/level.h>

#include <sawtooth_sdk/sawtooth_sdk.h>
#include <sawtooth_sdk/exceptions.h>

#include <cryptopp/sha.h>
#include <cryptopp/filters.h>
#include <cryptopp/hex.h>

using namespace log4cxx;

static log4cxx::LoggerPtr logger(log4cxx::Logger::getLogger
    ("CookieMaker"));

static const std::string COOKIE_MAKER_NAMESPACE = "cookie-maker";
#define URL_DEFAULT "tcp://127.0.0.1:4004"


// Helper function to generate an SHA512 hash and return it as a hex
// encoded string.
static std::string SHA512(const std::string& message) {
    std::string digest;
    CryptoPP::SHA512 hash;

    CryptoPP::StringSource hasher(message, true,
        new CryptoPP::HashFilter(hash,
          new CryptoPP::HexEncoder (
             new CryptoPP::StringSink(digest), false)));

    return digest;
}

// utility function to provide copy conversion from vector of bytes
// to an stl string container.
std::string ToString(const std::vector<std::uint8_t>& in) {
    const char* data = reinterpret_cast<const char*>(&(in[0]));
    std::string out(data, data+in.size());
    return out;
}

// utility function to provide copy conversion from stl string container
// to a vector of bytes.
std::vector<std::uint8_t> ToVector(const std::string& in) {
    std::vector<std::uint8_t> out(in.begin(), in.end());
    return out;
}

// Handles the processing of CookieMaker transactions.
class CookieMakerApplicator:  public sawtooth::TransactionApplicator {
 public:
    CookieMakerApplicator(sawtooth::TransactionUPtr txn,
        sawtooth::GlobalStateUPtr state) :
        TransactionApplicator(std::move(txn), std::move(state)) { };

    void Apply() {
        std::cout << "CookieMakerApplicator::Apply";
        std::string key = this->txn->header()->GetValue(sawtooth::TransactionHeaderSignerPublicKey);

        const std::string& raw_data = this->txn->payload();
        std::string verb = raw_data;

        if (verb == "bake") {
            this->BakeCookie(key);
        } else if (verb == "eat") {
            this->EatCookie(key);
        } else {
            std::stringstream error;
            error << "invalid action: '" << verb << "'";
            throw sawtooth::InvalidTransaction(error.str());
        }
    }

 private:
    std::string MakeAddress(const std::string& key) {
        return SHA512(COOKIE_MAKER_NAMESPACE).substr(0, 6) +
            SHA512(key).substr(64, 127);
    }
    void BakeCookie(const std::string& key) {
        auto address = this->MakeAddress(key);
        LOG4CXX_DEBUG(logger, "CookieMakerApplicator::BakeCookie Key: " << key
            << " Address: " << address);

        uint32_t value = 0;
        std::string state_value_rep;
        if(this->state->GetState(&state_value_rep, address)) {
            if (state_value_rep.length() != 0) { // empty rep
                value = atoi(state_value_rep.c_str());
            }
        }

        value++;

        // encode the value map back to string for storage.
        LOG4CXX_DEBUG(logger, "Storing " << value << " cookies");
        std::stringstream state;
        state << value;
        state_value_rep = state.str();
        this->state->SetState(address, state_value_rep);
    }

    // Handle an CookieMaker 'eat' verb action.
    // This decrements an CookieMaker holdings
    // stored in global state by a given value.
    void EatCookie(const std::string& key) {

        auto address = this->MakeAddress(key);

        LOG4CXX_DEBUG(logger, "CookieMakerApplicator::EatCookie Key: " << key
            << " Address: " << address);
        uint32_t value = 0;
        std::string state_value_rep;
        if(this->state->GetState(&state_value_rep, address)) {
            value = atoi(state_value_rep.c_str());
        } else {
            std::stringstream error;
            error << "Verb was 'eat', but address not found in state for " <<
                        "Key: " << key;
            throw sawtooth::InvalidTransaction(error.str());
        }

        value--;

        // encode the value map back to string for storage.
        LOG4CXX_DEBUG(logger, "Storing " << value << " cookies");
        std::stringstream state;
        state << value;
        state_value_rep = state.str();
        this->state->SetState(address, state_value_rep);
    }
};

// Defines the CookieMaker Handler to register with the transaction processor
// sets the versions and types of transactions that can be handled.
class CookieMakerHandler: public sawtooth::TransactionHandler {
public:
    CookieMakerHandler() {
        this->namespacePrefix = SHA512(COOKIE_MAKER_NAMESPACE).substr(0, 6);
        LOG4CXX_DEBUG(logger, "namespace:" << this->namespacePrefix);
    }

    std::string transaction_family_name() const {
        return std::string("cookie-maker");
    }

    std::list<std::string> versions() const {
        return {"1.0"};
    }

    std::list<std::string> namespaces() const {
        return { namespacePrefix };
    }

    sawtooth::TransactionApplicatorUPtr GetApplicator(
            sawtooth::TransactionUPtr txn,
            sawtooth::GlobalStateUPtr state) {
        return sawtooth::TransactionApplicatorUPtr(
            new CookieMakerApplicator(std::move(txn), std::move(state)));
    }
private:
    std::string namespacePrefix;
};


void Usage(bool bExit = false, int exitCode = 1) {
    std::cout << "Usage" << std::endl;
    std::cout << "cookie-maker-tp [options] [connet_string]" << std::endl;
    std::cout << "  -h, --help - print this message" << std::endl;

    std::cout <<
    "  connect_string - connect string to validator in format tcp://host:port"
    << std::endl;

    if (bExit) {
        exit(exitCode);
    }
}

void ParseArgs(int argc, char** argv, std::string& connectStr) {
    bool bLogLevelSet = false;

    for (int i = 1; i < argc; i++) {
        const char* arg = argv[i];
        if (!strcmp(arg, "-h") || !strcmp(arg, "--help")) {
            Usage(true, 0);
        } else if (i != (argc - 1)) {
            std::cout << "Invalid command line argument:" << arg << std::endl;
            Usage(true);
        } else {
            connectStr = arg;
        }
    }
}

int main(int argc, char** argv) {
    try {
        std::string connectString = URL_DEFAULT;

        ParseArgs(argc, argv, connectString);

        // Set up a simple configuration that logs on the console.
        BasicConfigurator::configure();
        logger->setLevel(Level::getAll());

        // Create a transaction processor and register our
        // handlers with it.
        sawtooth::TransactionProcessor* p =
        sawtooth::TransactionProcessor::Create(connectString);
        sawtooth::TransactionProcessorUPtr processor(p);

        sawtooth::TransactionHandlerUPtr transaction_handler(
            new CookieMakerHandler());

        processor->RegisterHandler(
            std::move(transaction_handler));

        processor->Run();

        return 0;
    } catch(std::exception& e) {
        std::cerr << "Unexpected exception exiting: " << std::endl;
        std::cerr << e.what() << std::endl;
    } catch(...) {
        std::cerr << "Exiting due to unknown exception." << std::endl;
    }
    return -1;
}
